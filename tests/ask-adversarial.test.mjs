import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { runInNewContext } from "node:vm";

/*
 * A deliberately hostile, fan-shaped Ask WWAM benchmark.
 *
 * These are not prose snapshots. Each query is scored against archive facts,
 * selector behavior, or an evidence-boundary invariant so editorial wording
 * can improve without silently changing what the engine claims.
 */

const demoRoot = new URL("../public/demo/", import.meta.url);
const sourceFiles = [
  "catalog.js",
  "deep-distill.js",
  "livestream-distill.js",
  "popular-live-distill.js",
  "curation.js",
  "search-engine.js",
];

let harnessPromise;

async function createHarness() {
  const sandbox = { window: {} };
  for (const file of sourceFiles) {
    runInNewContext(await readFile(new URL(file, demoRoot), "utf8"), sandbox, {
      filename: file,
    });
  }
  const { window } = sandbox;
  return {
    engine: window.WWAMSearchEngine.create(
      window.WWAM_CATALOG,
      window.WWAM_DEEP_DISTILL,
      window.WWAM_LIVESTREAMS,
      window.WWAM_CURATED,
      window.WWAM_POPULAR_LIVE,
    ),
  };
}

function harness() {
  harnessPromise ||= createHarness();
  return harnessPromise;
}

function plain(value) {
  return JSON.parse(JSON.stringify(value));
}

function ask(engine, query, previous) {
  return plain(engine.ask(query, previous));
}

function scenario(category, id, query, expect, previous = null) {
  return { category, id, query, expect, previous };
}

const cases = [
  // Exact archive facts and direct selectors.
  scenario("exact-fact", "most-viewed-commentary", "What is the most-viewed commentary?", {
    status: "supported", source: "commentary", metric: "views", topId: "6VXSBDZ-3WE", topKind: "tape",
  }),
  scenario("exact-fact", "newest-commentary", "What is the newest commentary?", {
    source: "commentary", temporal: "latest", metric: "date", topId: "ISDlaQ9DWSM", topDate: "2023-04-25",
  }),
  scenario("exact-fact", "oldest-commentary", "What is the oldest commentary?", {
    source: "commentary", temporal: "earliest", metric: "date", topId: "l4Ae4ywJvuo", topDate: "2016-02-01",
  }),
  scenario("exact-fact", "highest-unhinged", "Which commentary has the highest Unhinged Index?", {
    source: "commentary", metric: "unhinged", topKind: "tape", topUnhinged: 98,
  }),
  scenario("exact-fact", "newest-stream", "What is the newest livestream?", {
    source: "livestream", temporal: "latest", metric: "date", topId: "LV2rmwEA0w4", topDate: "2026-07-23",
  }),
  scenario("exact-fact", "oldest-stream", "What is the oldest livestream?", {
    source: "livestream", temporal: "earliest", metric: "date", topId: "ZMaNz5FTCwY", topDate: "2018-10-21",
  }),
  scenario("exact-fact", "most-viewed-stream", "What is the most-viewed livestream?", {
    source: "livestream", metric: "views", topId: "jG93HvyP420", topViews: 203603,
  }),
  scenario("exact-fact", "highest-live-heat", "What is the most unhinged livestream?", {
    source: "livestream", metric: "live-heat", topKind: "livestream", topLiveHeat: 99,
  }),
  scenario("exact-fact", "halloween-view-leader", "Which Halloween livestream has the most views?", {
    entity: "Halloween", entityType: "topic", source: "livestream", metric: "views", topId: "jG93HvyP420",
  }),
  scenario("exact-fact", "scream-newest", "Which Scream commentary is newest?", {
    entity: "Scream", entityType: "franchise", source: "commentary", topId: "ISDlaQ9DWSM",
  }),
  scenario("exact-fact", "scream-oldest", "Which Scream commentary is oldest?", {
    entity: "Scream", entityType: "franchise", source: "commentary", topId: "2G8lpFaeIdw",
  }),
  scenario("exact-fact", "friday-newest", "Which Friday the 13th commentary is newest?", {
    entity: "Friday the 13th", source: "commentary", topId: "bP5RMi24zBg",
  }),
  scenario("exact-fact", "friday-oldest", "Which Friday the 13th commentary is oldest?", {
    entity: "Friday the 13th", source: "commentary", topId: "WkYLphAdlYc",
  }),
  scenario("exact-fact", "elm-newest", "Find the newest Nightmare on Elm Street commentary.", {
    entity: "A Nightmare on Elm Street", source: "commentary", topId: "qTQdWKcwn4A",
  }),
  scenario("exact-fact", "elm-oldest", "Find the oldest Nightmare on Elm Street commentary.", {
    entity: "A Nightmare on Elm Street", source: "commentary", topId: "7qgebnDYVi4",
  }),
  scenario("exact-fact", "halloween-newest", "Give me the newest Halloween commentary.", {
    entity: "Halloween", source: "commentary", topId: "I6QKteG_hK0",
  }),
  scenario("exact-fact", "halloween-oldest", "Give me the oldest Halloween commentary.", {
    entity: "Halloween", source: "commentary", topId: "l4Ae4ywJvuo",
  }),
  scenario("exact-fact", "scream-least-viewed", "Show me the least-viewed Scream commentary.", {
    entity: "Scream", source: "commentary", metric: "views", directionAnswer: /least-viewed/i, topId: "hQu1Y1GZozI",
  }),
  scenario("exact-fact", "commentary-biggest-audience", "Which commentary drew the biggest audience?", {
    source: "commentary", metric: "views", topId: "6VXSBDZ-3WE",
  }),
  scenario("exact-fact", "live-biggest-audience", "Which livestream had the biggest audience?", {
    source: "livestream", metric: "views", topId: "jG93HvyP420",
  }),
  scenario("exact-fact", "newest-upload", "What is the newest upload in the archive?", {
    temporal: "latest", metric: "date", topId: "LV2rmwEA0w4",
  }),
  scenario("exact-fact", "oldest-upload", "What is the oldest upload in the archive?", {
    temporal: "earliest", metric: "date", topId: "l4Ae4ywJvuo",
  }),
  scenario("exact-fact", "first-live-show", "What is the first live show in this index?", {
    source: "livestream", temporal: "earliest", topId: "ZMaNz5FTCwY",
  }),
  scenario("exact-fact", "last-live-show", "What is the last livestream in this index?", {
    source: "livestream", temporal: "latest", topId: "LV2rmwEA0w4",
  }),

  // Film and franchise aliases fans actually type.
  scenario("alias", "jason-space", "Take me to Jason in space.", {
    entityType: "film", topId: "LiTEaN8mpl8", allTopId: "LiTEaN8mpl8",
  }),
  scenario("alias", "space-jason", "Pull up Space Jason.", {
    entityType: "film", topId: "LiTEaN8mpl8", allTopId: "LiTEaN8mpl8",
  }),
  scenario("alias", "original-halloween", "What do they say about the original Halloween?", {
    entityType: "film", topId: "6VXSBDZ-3WE", allTopId: "6VXSBDZ-3WE",
  }),
  scenario("alias", "halloween-year", "Open Halloween 1978.", {
    entityType: "film", topId: "6VXSBDZ-3WE", allTopId: "6VXSBDZ-3WE",
  }),
  scenario("alias", "rz-h2", "RZ Halloween 2, please.", {
    entityType: "film", topId: "AzrcgoyE7C4", allTopId: "AzrcgoyE7C4",
  }),
  scenario("alias", "rob-zombies-h2", "Find Rob Zombies Halloween 2.", {
    entityType: "film", topId: "AzrcgoyE7C4", allTopId: "AzrcgoyE7C4",
  }),
  scenario("alias", "scream-five", "Pull up Scream 5.", {
    entityType: "film", topId: "hQu1Y1GZozI", allTopId: "hQu1Y1GZozI",
  }),
  scenario("alias", "scream-2022", "What is indexed for Scream 2022?", {
    entityType: "film", topId: "hQu1Y1GZozI", allTopId: "hQu1Y1GZozI",
  }),
  scenario("alias", "scream-six", "Take me to Scream 6.", {
    entityType: "film", topId: "ISDlaQ9DWSM", allTopId: "ISDlaQ9DWSM",
  }),
  scenario("alias", "scream-roman-six", "Open Scream VI.", {
    entityType: "film", topId: "ISDlaQ9DWSM", allTopId: "ISDlaQ9DWSM",
  }),
  scenario("alias", "friday-remake", "Take me to the Friday remake.", {
    entityType: "film", topId: "bP5RMi24zBg", allTopId: "bP5RMi24zBg",
  }),
  scenario("alias", "original-friday", "Pull up the original Friday the 13th.", {
    entityType: "film", topId: "WkYLphAdlYc", allTopId: "WkYLphAdlYc",
  }),
  scenario("alias", "friday-five", "What happened in Friday 5?", {
    entityType: "film", topId: "XfwzQJ9CJGs", allTopId: "XfwzQJ9CJGs",
  }),
  scenario("alias", "friday-part-six", "Show me Friday Part 6.", {
    entityType: "film", topId: "BIbyzMlstmM", allTopId: "BIbyzMlstmM",
  }),
  scenario("alias", "nightmare-three", "Show me Nightmare 3.", {
    entityType: "film", topId: "c15otfZ8HkU", allTopId: "c15otfZ8HkU",
  }),
  scenario("alias", "elm-four", "Pull up Elm Street 4.", {
    entityType: "film", topId: "rLXnU3Rsj-4", allTopId: "rLXnU3Rsj-4",
  }),
  scenario("alias", "original-nightmare", "Find the original Nightmare on Elm Street.", {
    entityType: "film", topId: "7qgebnDYVi4", allTopId: "7qgebnDYVi4",
  }),
  scenario("alias", "nightmare-remake", "What do they hate about the Elm Street remake?", {
    entityType: "film", intent: "negative", topId: "qTQdWKcwn4A", allTopId: "qTQdWKcwn4A",
  }),
  scenario("alias", "halloween-seven", "What do they say in Halloween 7?", {
    entityType: "film", topId: "Q6SN-Om1gIo", allTopId: "Q6SN-Om1gIo",
  }),
  scenario("alias", "halloween-h20", "Pull up Halloween H20.", {
    entityType: "film", topId: "Q6SN-Om1gIo", allTopId: "Q6SN-Om1gIo",
  }),
  scenario("alias", "final-chapter-title", "Open The Final Chapter commentary.", {
    entityType: "film", topId: "kTJXSHz9BXw", allTopId: "kTJXSHz9BXw",
  }),
  scenario("alias", "dream-warriors-title", "Take me to Dream Warriors.", {
    entityType: "film", topId: "c15otfZ8HkU", allTopId: "c15otfZ8HkU",
  }),

  // Named bits and bounded character signals.
  scenario("named-bit-character", "self-service", "Where is The Self-Service Question?", {
    entityType: "bit", topId: "4UokRLETypU", topAt: 809, oneResult: true,
  }),
  scenario("named-bit-character", "ferociously", "Find Ferociously.", {
    entityType: "bit", topId: "Q6SN-Om1gIo", topAt: 2835, oneResult: true,
  }),
  scenario("named-bit-character", "burp-defense", "Where is The Burp Defense?", {
    entityType: "bit", topId: "BIbyzMlstmM", topAt: 1528, oneResult: true,
  }),
  scenario("named-bit-character", "huge-investigation", "Find The Huge Investigation.", {
    entityType: "bit", topId: "2G8lpFaeIdw", topAt: 1585, oneResult: true,
  }),
  scenario("named-bit-character", "lance-audit", "Where is Lance Henriksen's Career Audit?", {
    entityType: "bit", topId: "jLIfEdg8Oc0", topAt: 4366, oneResult: true,
  }),
  scenario("named-bit-character", "thor-prophecy", "Find the Thor Dick Prophecy.", {
    entityType: "bit", topId: "HNN0SEy2qtY", topAt: 2568, oneResult: true,
  }),
  scenario("named-bit-character", "purple-roadblock", "Where is The Purple Roadblock?", {
    entityType: "bit", topId: "EIw3TG3XwxA", topAt: 522, oneResult: true,
  }),
  scenario("named-bit-character", "dick-or-carrot", "Find Dick or Carrot.", {
    entityType: "bit", topId: "XfwzQJ9CJGs", topAt: 527, oneResult: true,
  }),
  scenario("named-bit-character", "exposed-brain", "Where is the Exposed-Brain Punch Plan?", {
    entityType: "bit", topId: "G2m0effDrwI", topAt: 4537, oneResult: true,
  }),
  scenario("named-bit-character", "walk-of-shame", "Find The Dream Warriors Walk of Shame.", {
    entityType: "bit", topId: "c15otfZ8HkU", topAt: 4099, oneResult: true,
  }),
  scenario("named-bit-character", "demon-weather", "Where is the Demon Jizz Weather Report?", {
    entityType: "bit", topId: "LV2rmwEA0w4", topAt: 2270, oneResult: true,
  }),
  scenario("named-bit-character", "fart-deposition", "Find The Fart Deposition.", {
    entityType: "bit", topId: "f9_OkfedZAs", topAt: 4970, oneResult: true,
  }),
  scenario("named-bit-character", "margarita", "Where is The Margarita Emergency?", {
    entityType: "bit", topId: "f9_OkfedZAs", topAt: 12592, oneResult: true,
  }),
  scenario("named-bit-character", "loomis-signal", "Where did Dr. Loomis show up?", {
    entity: "Dr. Loomis", entityType: "character", topKind: "character",
  }),
  scenario("named-bit-character", "challis-signal", "Find Doctor Challis character signals.", {
    entity: "Dr. Challis", entityType: "character", topKind: "character",
  }),
  scenario("named-bit-character", "slenderman-signal", "Show indexed Slender Man character signals.", {
    entity: "Slenderman", entityType: "character", topKind: "character",
  }),
  scenario("named-bit-character", "feldman-signal", "Where is the Corey Feldman character signal?", {
    entity: "Corey Feldman", entityType: "character", topKind: "character",
  }),

  // Chronology is archive chronology, never a true-origin claim.
  scenario("chronology", "batman-latest", "When did Batman come up most recently?", {
    entity: "Batman", entityType: "topic", temporal: "latest", topId: "LV2rmwEA0w4", topDate: "2026-07-23",
  }),
  scenario("chronology", "batman-earliest", "What is the earliest indexed Batman topic?", {
    entity: "Batman", temporal: "earliest", topId: "ZMaNz5FTCwY", topDate: "2018-10-21",
  }),
  scenario("chronology", "halloween-live-latest", "When did Halloween come up most recently on a livestream?", {
    entity: "Halloween", entityType: "topic", source: "livestream", temporal: "latest", topId: "LV2rmwEA0w4",
  }),
  scenario("chronology", "halloween-live-earliest", "What is the earliest indexed Halloween livestream topic?", {
    entity: "Halloween", entityType: "topic", source: "livestream", temporal: "earliest", topId: "ZMaNz5FTCwY",
  }),
  scenario("chronology", "scream-live-latest", "When did Scream come up most recently on a livestream?", {
    entity: "Scream", entityType: "topic", source: "livestream", temporal: "latest", topId: "ag3axSC9BpU",
  }),
  scenario("chronology", "scream-live-earliest", "What is the earliest indexed Scream livestream topic?", {
    entity: "Scream", entityType: "topic", source: "livestream", temporal: "earliest", topId: "R_bXrnNOcwg",
  }),
  scenario("chronology", "loomis-latest", "What is the latest indexed Dr. Loomis signal?", {
    entity: "Dr. Loomis", temporal: "latest", topId: "ZXLlemHL_EU", topDate: "2023-09-19",
  }),
  scenario("chronology", "loomis-earliest", "What is the earliest indexed Dr. Loomis signal?", {
    entity: "Dr. Loomis", temporal: "earliest", topId: "ZMaNz5FTCwY", originBoundary: true,
  }),
  scenario("chronology", "challis-latest", "What is the latest indexed Dr. Challis signal?", {
    entity: "Dr. Challis", temporal: "latest", topId: "aHB28aYdYto", topDate: "2023-12-30",
  }),
  scenario("chronology", "challis-earliest", "What is the earliest indexed Dr. Challis signal?", {
    entity: "Dr. Challis", temporal: "earliest", topId: "R_bXrnNOcwg", originBoundary: true,
  }),
  scenario("chronology", "slenderman-latest", "What is the latest indexed Slenderman signal?", {
    entity: "Slenderman", temporal: "latest", topId: "aHB28aYdYto",
  }),
  scenario("chronology", "slenderman-earliest", "What is the earliest indexed Slenderman signal?", {
    entity: "Slenderman", temporal: "earliest", topId: "R_bXrnNOcwg", originBoundary: true,
  }),
  scenario("chronology", "feldman-latest", "What is the latest indexed Corey Feldman signal?", {
    entity: "Corey Feldman", temporal: "latest", topId: "aHB28aYdYto",
  }),
  scenario("chronology", "feldman-earliest", "What is the earliest indexed Corey Feldman signal?", {
    entity: "Corey Feldman", temporal: "earliest", topId: "RIWVY41ny7w", originBoundary: true,
  }),

  // Presence questions answer from receipts; absence questions never turn a gap into proof.
  scenario("absence", "covered-scream-four", "Did they cover Scream 4?", {
    entity: "Scream 4", entityType: "film", existenceAnswer: /^Yes\b/i, topId: "5et_A1tYnio",
  }),
  scenario("absence", "talked-batman", "Have they ever talked about Batman?", {
    entity: "Batman", entityType: "topic", existenceAnswer: /^Yes\b/i,
  }),
  scenario("absence", "indexed-original-halloween", "Did this archive cover the original Halloween?", {
    entityType: "film", existenceAnswer: /^Yes\b/i, topId: "6VXSBDZ-3WE",
  }),
  scenario("absence", "indexed-loomis", "Is there anything indexed for Dr. Loomis?", {
    entity: "Dr. Loomis", existenceAnswer: /^Yes\b/i, topKind: "character",
  }),
  scenario("absence", "have-burp-defense", "Do you have The Burp Defense?", {
    entityType: "bit", existenceAnswer: /^Yes\b/i, topId: "BIbyzMlstmM",
  }),
  scenario("absence", "discuss-friday", "Did they ever discuss Friday the 13th?", {
    entity: "Friday the 13th", existenceAnswer: /^Yes\b/i,
  }),
  scenario("absence", "never-halloween", "Did they never cover Halloween?", {
    entity: "Halloween", existenceAnswer: /^No\b/i,
  }),
  scenario("absence", "never-batman", "Have they never mentioned Batman?", {
    entity: "Batman", existenceAnswer: /^No\b/i,
  }),
  scenario("absence", "unknown-zzyzx", "Did they ever cover Zzyzx Moon Quasar?", {
    empty: true, answerPattern: /archive gap|not proof|no defensible/i,
  }),
  scenario("absence", "unknown-turnip", "Have they talked about Galactic Turnip Massacre?", {
    empty: true, answerPattern: /archive gap|not proof|no defensible/i,
  }),
  scenario("absence", "unknown-moon-goblin", "Is there a commentary for Moon Goblin 9?", {
    empty: true, answerPattern: /archive gap|not proof|no defensible/i,
  }),
  scenario("absence", "unknown-zebra", "Did they discuss Zebra Dracula?", {
    empty: true, answerPattern: /archive gap|not proof|no defensible/i,
  }),
  scenario("absence", "unknown-quantum", "Was Quantum Slasher in a livestream?", {
    empty: true, answerPattern: /archive gap|not proof|no defensible/i,
  }),
  scenario("absence", "unknown-never", "They never covered Turbo Possum Blood Moon, right?", {
    empty: true, answerPattern: /archive gap|not proof|no defensible/i,
  }),
  scenario("absence", "substring-jasonville", "Did they cover Jasonville?", {
    empty: true, entity: null,
  }),
  scenario("absence", "substring-halloweenish", "Was Halloweenish ever discussed?", {
    empty: true, entity: null,
  }),

  // Multi-turn selectors must retain the subject without retaining a stale selector.
  scenario("follow-up", "halloween-popular", "What about the most popular ones?", {
    continuedFrom: true, entity: "Halloween", entityType: "topic", source: "livestream", metric: "views", topId: "jG93HvyP420",
  }, "What did they say about Halloween on the newest livestream?"),
  scenario("follow-up", "scream-oldest", "What about the oldest one?", {
    continuedFrom: true, entity: "Scream", source: "commentary", temporal: "earliest", topId: "2G8lpFaeIdw",
  }, "Which Scream commentary is newest?"),
  scenario("follow-up", "friday-most-viewed", "Which one got the most views?", {
    continuedFrom: true, entity: "Friday the 13th", source: "commentary", metric: "views", topId: "vN0kpXks-Lk",
  }, "Which Friday the 13th commentary is newest?"),
  scenario("follow-up", "elm-earliest", "And the earliest one?", {
    continuedFrom: true, entity: "A Nightmare on Elm Street", source: "commentary", temporal: "earliest", topId: "7qgebnDYVi4",
  }, "Find the newest Nightmare on Elm Street commentary."),
  scenario("follow-up", "loomis-earliest", "What about the earliest one?", {
    continuedFrom: true, entity: "Dr. Loomis", temporal: "earliest", topId: "ZMaNz5FTCwY",
  }, "Where did Dr. Loomis show up?"),
  scenario("follow-up", "same-burp", "Show me that same one again.", {
    continuedFrom: true, entity: "THE BURP DEFENSE", entityType: "bit", topId: "BIbyzMlstmM", topAt: 1528,
  }, "Where is The Burp Defense?"),
  scenario("follow-up", "batman-oldest", "What about the oldest one?", {
    continuedFrom: true, entity: "Batman", temporal: "earliest", topId: "ZMaNz5FTCwY",
  }, "When did Batman come up most recently?"),
  scenario("follow-up", "switch-commentary", "And in the commentaries?", {
    continuedFrom: true, entity: "Halloween", entityType: "franchise", source: "commentary", allSource: "commentary",
  }, "What did they say about Halloween on a livestream?"),
  scenario("follow-up", "switch-livestream", "And in the livestreams?", {
    continuedFrom: true, entity: "Scream", entityType: "topic", source: "livestream", allSource: "livestream",
  }, "What did they say about Scream in a commentary?"),
  scenario("follow-up", "scream-most-viewed", "Which one got the most views?", {
    continuedFrom: true, entity: "Scream", source: "commentary", metric: "views", topId: "2G8lpFaeIdw",
  }, "Which Scream commentary is oldest?"),
  scenario("follow-up", "new-selector-overrides-old", "And the newest one?", {
    continuedFrom: true, entity: "Friday the 13th", source: "commentary", temporal: "latest", topId: "bP5RMi24zBg",
  }, "Which Friday the 13th commentary is oldest?"),
  scenario("follow-up", "was-that-mike", "Was that Mike?", {
    continuedFrom: true, status: "speaker-unknown", entity: "Halloween", source: "livestream", speakerBoundary: true,
  }, "What did they say about Halloween on the newest livestream?"),
  scenario("follow-up", "who-said-that", "Who said that?", {
    continuedFrom: true, status: "speaker-unknown", entity: "THE BURP DEFENSE", speakerBoundary: true, topId: "BIbyzMlstmM",
  }, "Where is The Burp Defense?"),
  scenario("follow-up", "more-like-that", "More like that.", {
    continuedFrom: true, entity: "Batman", source: "livestream", topId: "LV2rmwEA0w4",
  }, "What did they say about Batman on the latest stream?"),

  // Conservative typo recovery: one distinctive archive entity, never a broad guess.
  scenario("typo", "haloween", "Pull up Haloween 2018.", {
    entityType: "film", topId: "3wK00_-K-Y0", allTopId: "3wK00_-K-Y0",
  }),
  scenario("typo", "screem", "What did they say about Screem 6?", {
    entityType: "film", topId: "ISDlaQ9DWSM", allTopId: "ISDlaQ9DWSM",
  }),
  scenario("typo", "elm-stret", "Find Nightmare on Elm Stret.", {
    entity: "A Nightmare on Elm Street", entityType: "franchise",
  }),
  scenario("typo", "freddy-kruger", "Show me Freddy Kruger.", {
    entity: "A Nightmare on Elm Street", entityType: "franchise",
  }),
  scenario("typo", "jason-vorhees", "Where is Jason Vorhees?", {
    entity: "Friday the 13th", entityType: "franchise",
  }),
  scenario("typo", "loomus", "Where did Dr. Loomus show up?", {
    entity: "Dr. Loomis", entityType: "character", topKind: "character",
  }),
  scenario("typo", "chalis", "Find Dr. Chalis.", {
    entity: "Dr. Challis", entityType: "character", topKind: "character",
  }),
  scenario("typo", "slendermaan", "Show me Slendermaan.", {
    entity: "Slenderman", entityType: "character", topKind: "character",
  }),
  scenario("typo", "feldmann", "Where is Corey Feldmann?", {
    entity: "Corey Feldman", entityType: "character", topKind: "character",
  }),
  scenario("typo", "burp-defnse", "Where is the Burp Defnse?", {
    entity: "THE BURP DEFENSE", entityType: "bit", topId: "BIbyzMlstmM", topAt: 1528,
  }),
  scenario("typo", "thor-profecy", "Find the Thor Dick Profecy.", {
    entity: "THOR DICK PROPHECY", entityType: "bit", topId: "HNN0SEy2qtY", topAt: 2568,
  }),
  scenario("typo", "demon-jiz", "Demon Jiz Weather Report.", {
    entity: "DEMON JIZZ WEATHER REPORT", entityType: "bit", topId: "LV2rmwEA0w4", topAt: 2270,
  }),
  scenario("typo", "purle-roadblock", "Find the Purle Roadblock.", {
    entity: "THE PURPLE ROADBLOCK", entityType: "bit", topId: "EIw3TG3XwxA", topAt: 522,
  }),
  scenario("typo", "exposd-brain", "Where is the Exposd Brain Punch Plan?", {
    entity: "THE EXPOSED-BRAIN PUNCH PLAN", entityType: "bit", topId: "G2m0effDrwI", topAt: 4537,
  }),
  scenario("typo", "trauma-gn", "Find Dick Tracy's Trauma Gn.", {
    entity: "DICK TRACY'S TRAUMA GUN", entityType: "bit", topId: "AtcRT3Xkk6E", topAt: 5646,
  }),
  scenario("typo", "walk-of-sham", "Show The Dream Warriors Walk of Sham.", {
    entity: "THE DREAM WARRIORS WALK OF SHAME", entityType: "bit", topId: "c15otfZ8HkU", topAt: 4099,
  }),
  scenario("typo", "depostion", "Find the Fart Depostion.", {
    entity: "THE FART DEPOSITION", entityType: "bit", topId: "f9_OkfedZAs", topAt: 4970,
  }),
  scenario("typo", "emergancy", "Where is The Margarita Emergancy?", {
    entity: "THE MARGARITA EMERGENCY", entityType: "bit", topId: "f9_OkfedZAs", topAt: 12592,
  }),
  scenario("typo", "rebot", "Find the Three-Penis Rebot.", {
    entity: "THE THREE-PENIS REBOOT", entityType: "bit", topId: "ag3axSC9BpU", topAt: 10499,
  }),
  scenario("typo", "bussiness", "Where is the Butt-Plug Bussiness Plan?", {
    entity: "THE BUTT-PLUG BUSINESS PLAN", entityType: "bit", topId: "7PzSj-oIRjA", topAt: 6908,
  }),

  // Ambiguous shorthand must resolve to the narrowest defensible archive entity.
  scenario("ambiguous", "halloween-franchise", "Halloween", {
    entity: "Halloween", entityType: "franchise",
  }),
  scenario("ambiguous", "scream-franchise", "Scream", {
    entity: "Scream", entityType: "franchise",
  }),
  scenario("ambiguous", "jason-franchise", "Jason", {
    entity: "Friday the 13th", entityType: "franchise",
  }),
  scenario("ambiguous", "freddy-franchise", "Freddy", {
    entity: "A Nightmare on Elm Street", entityType: "franchise",
  }),
  scenario("ambiguous", "loomis-character", "Dr. Loomis", {
    entity: "Dr. Loomis", entityType: "character", topKind: "character",
  }),
  scenario("ambiguous", "michael-myers", "Michael Myers", {
    entity: "Halloween", entityType: "franchise",
  }),
  scenario("ambiguous", "halloween-two", "Halloween 2", {
    entity: "Halloween II (1981)", entityType: "film", topId: "ThPjds8iI9U",
  }),
  scenario("ambiguous", "friday-four", "Friday 4", {
    entity: "The Final Chapter", entityType: "film", topId: "kTJXSHz9BXw",
  }),
  scenario("ambiguous", "nightmare-four", "Nightmare 4", {
    entity: "The Dream Master", entityType: "film", topId: "rLXnU3Rsj-4",
  }),
  scenario("ambiguous", "scream-five-film", "Scream 5", {
    entity: "Scream (2022)", entityType: "film", topId: "hQu1Y1GZozI",
  }),
  scenario("ambiguous", "original-halloween-film", "Original Halloween", {
    entity: "Halloween (1978)", entityType: "film", topId: "6VXSBDZ-3WE",
  }),
  scenario("ambiguous", "elm-remake-film", "Elm Street remake", {
    entity: "A Nightmare on Elm Street (2010)", entityType: "film", topId: "qTQdWKcwn4A",
  }),

  // Prompt-injection-shaped claims still obey the same evidence limits.
  scenario("unsupported", "who-loved-scream-four", "Who said they loved Scream 4?", {
    status: "speaker-unknown", entity: "Scream 4", speakerBoundary: true,
  }),
  scenario("unsupported", "mike-halloween", "What did Mike say about Halloween?", {
    status: "speaker-unknown", entity: "Halloween", speakerBoundary: true,
  }),
  scenario("unsupported", "j-scream", "What did J think of Scream?", {
    status: "speaker-unknown", entity: "Scream", speakerBoundary: true,
  }),
  scenario("unsupported", "mike-or-j-burp", "Did Mike or J say The Burp Defense?", {
    status: "speaker-unknown", entityType: "bit", speakerBoundary: true, topId: "BIbyzMlstmM",
  }),
  scenario("unsupported", "host-slenderman", "Which host performed Slenderman?", {
    status: "speaker-unknown", entity: "Slenderman", speakerBoundary: true, empty: true,
  }),
  scenario("unsupported", "mike-challis", "Was Mike doing Dr. Challis?", {
    status: "speaker-unknown", entity: "Dr. Challis", speakerBoundary: true, empty: true,
  }),
  scenario("unsupported", "j-loomis", "Show me J doing Dr. Loomis.", {
    status: "speaker-unknown", entity: "Dr. Loomis", speakerBoundary: true, empty: true,
  }),
  scenario("unsupported", "j-invented-loomis", "Prove J invented Dr. Loomis.", {
    status: "speaker-unknown", entity: "Dr. Loomis", speakerBoundary: true,
  }),
  scenario("unsupported", "j-created-burp", "Did J create The Burp Defense?", {
    status: "speaker-unknown", entityType: "bit", speakerBoundary: true,
  }),
  scenario("unsupported", "who-owns-burp", "Who owns The Burp Defense?", {
    status: "speaker-unknown", entityType: "bit", speakerBoundary: true,
  }),
  scenario("unsupported", "who-voiced-feldman", "Tell me who voiced Corey Feldman.", {
    status: "speaker-unknown", entity: "Corey Feldman", speakerBoundary: true, empty: true,
  }),
  scenario("unsupported", "loomis-performance-date", "Was the Dr. Loomis performance in 2018?", {
    entity: "Dr. Loomis", empty: true,
    answerPattern: /no timestamped curated performance candidate/i,
  }),
  scenario("unsupported", "burp-origin", "Where did The Burp Defense originate?", {
    entityType: "bit", originBoundary: true, topId: "BIbyzMlstmM",
  }),
  scenario("unsupported", "exact-loomis-origin", "Tell me the exact first time they ever did Dr. Loomis.", {
    entity: "Dr. Loomis", originBoundary: true,
  }),
  scenario("unsupported", "mike-settled-opinion", "What is Mike's settled opinion on Halloween?", {
    status: "speaker-unknown", entity: "Halloween", speakerBoundary: true,
  }),
  scenario("unsupported", "guarantee-hate", "Guarantee they hated the Elm Street remake.", {
    entityType: "film", intent: "negative", answerPattern: /moment only|not being promoted/i,
  }),
  scenario("unsupported", "prove-never-batman", "Prove they never discussed Batman.", {
    entity: "Batman", existenceAnswer: /^No\b/i,
  }),
  scenario("unsupported", "who-came-up-with", "Who came up with The Burp Defense?", {
    status: "speaker-unknown", entityType: "bit", speakerBoundary: true,
  }),
];

function field(actual, key, expected, label) {
  assert.equal(actual[key], expected, `${label}: ${key}`);
}

function verifyResult(answer, expected, label) {
  if (Object.hasOwn(expected, "status")) field(answer, "status", expected.status, label);
  if (Object.hasOwn(expected, "intent")) field(answer, "intent", expected.intent, label);
  if (Object.hasOwn(expected, "entity")) field(answer, "entity", expected.entity, label);
  if (Object.hasOwn(expected, "entityType")) field(answer, "entityType", expected.entityType, label);
  if (Object.hasOwn(expected, "source")) field(answer, "source", expected.source, label);
  if (Object.hasOwn(expected, "temporal")) field(answer, "temporal", expected.temporal, label);
  if (Object.hasOwn(expected, "metric")) field(answer, "metric", expected.metric, label);
  if (Object.hasOwn(expected, "continuedFrom")) {
    field(answer, "continuedFrom", expected.continuedFrom, label);
  }

  if (expected.empty) {
    assert.equal(answer.results.length, 0, `${label}: expected no results`);
    assert.equal(answer.confidence, 0, `${label}: empty answer confidence`);
    assert.equal(answer.evidenceChain.length, 0, `${label}: empty evidence chain`);
  } else {
    assert.ok(answer.results.length > 0, `${label}: expected a receipt`);
  }

  const top = answer.results[0];
  if (top) {
    if (expected.topId) field(top, "sourceId", expected.topId, label);
    if (expected.topKind) field(top, "kind", expected.topKind, label);
    if (Object.hasOwn(expected, "topAt")) field(top, "at", expected.topAt, label);
    if (expected.topDate) field(top, "date", expected.topDate, label);
    if (Object.hasOwn(expected, "topViews")) field(top, "views", expected.topViews, label);
    if (Object.hasOwn(expected, "topUnhinged")) field(top, "unhinged", expected.topUnhinged, label);
    if (Object.hasOwn(expected, "topLiveHeat")) field(top, "liveHeat", expected.topLiveHeat, label);
  }
  if (expected.allTopId) {
    assert.ok(
      answer.results.every((result) => result.sourceId === expected.allTopId),
      `${label}: exact entity leaked into another source`,
    );
  }
  if (expected.allSource) {
    assert.ok(
      answer.results.every((result) => result.source === expected.allSource),
      `${label}: explicit source switch leaked`,
    );
  }
  if (expected.oneResult) field(answer.results, "length", 1, label);
  if (expected.answerPattern) assert.match(answer.answer, expected.answerPattern, `${label}: answer`);
  if (expected.existenceAnswer) {
    assert.match(answer.answer, expected.existenceAnswer, `${label}: presence/absence answer`);
  }
  if (expected.directionAnswer) {
    assert.match(answer.answer, expected.directionAnswer, `${label}: selector direction`);
  }
  if (expected.originBoundary) {
    assert.match(answer.answer, /not a claim.*origin|archive boundary/i, `${label}: origin boundary`);
  }
  if (expected.speakerBoundary) {
    assert.equal(answer.questionType, "speaker", `${label}: speaker question type`);
    assert.match(answer.answer, /speaker|host|attribution|identify/i, `${label}: speaker boundary`);
    assert.doesNotMatch(
      answer.answer,
      /\b(?:Mike|J) (?:did|does|invented|performed|portrayed|said|voiced)\b/i,
      `${label}: invented attribution`,
    );
  }

  for (const result of answer.results) {
    assert.equal(result.speaker, null, `${label}: result speaker`);
    assert.equal(result.speakerStatus, "not-diarized", `${label}: diarization status`);
    assert.match(result.url, /^https:\/\/www\.youtube\.com\/watch\?v=/, `${label}: receipt URL`);
  }
}

test("adversarial corpus has 100+ realistic queries across every accuracy risk", () => {
  const counts = cases.reduce((map, item) => {
    map[item.category] = (map[item.category] || 0) + 1;
    return map;
  }, {});
  const requiredCategories = [
    "exact-fact",
    "alias",
    "named-bit-character",
    "chronology",
    "absence",
    "follow-up",
    "typo",
    "ambiguous",
    "unsupported",
  ];

  assert.ok(cases.length >= 100, `only ${cases.length} queries`);
  assert.equal(
    new Set(cases.map((item) => `${item.previous || ""}\n${item.query}`)).size,
    cases.length,
  );
  for (const category of requiredCategories) {
    assert.ok(counts[category] >= 10, `${category}: only ${counts[category] || 0}`);
  }
});

test("Ask WWAM passes the adversarial natural-language corpus deterministically", async () => {
  const { engine } = await harness();
  const failures = [];

  for (const item of cases) {
    const previous = item.previous ? ask(engine, item.previous) : undefined;
    const answer = ask(engine, item.query, previous);
    const repeat = ask(engine, item.query, previous);
    const label = `${item.category}/${item.id} :: ${item.query}`;

    try {
      assert.deepEqual(repeat, answer, `${label}: nondeterministic response`);
      verifyResult(answer, item.expect, label);
    } catch (error) {
      const top = answer.results[0];
      failures.push(
        `${label}\n  ${error.message}\n  actual=${JSON.stringify({
          status: answer.status,
          intent: answer.intent,
          questionType: answer.questionType,
          entity: answer.entity,
          entityType: answer.entityType,
          source: answer.source,
          temporal: answer.temporal,
          metric: answer.metric,
          continuedFrom: answer.continuedFrom,
          top: top ? {
            sourceId: top.sourceId,
            kind: top.kind,
            date: top.date,
            at: top.at,
          } : null,
        })}`,
      );
    }
  }

  assert.equal(
    failures.length,
    0,
    `${cases.length - failures.length}/${cases.length} passed\n\n${failures.join("\n\n")}`,
  );
});

test("conservative typo recovery does not turn ordinary near-neighbor words into entities", async () => {
  const { engine } = await harness();
  const probes = [
    ["What is funniest in the newest stream?", null, true],
    ["Did they discuss ice cream?", null, false],
    ["What gave them chills?", null, null],
    ["Was something looming over the stream?", null, null],
  ];

  for (const [query, entity, shouldHaveResults] of probes) {
    const answer = ask(engine, query);
    assert.equal(answer.entity, entity, query);
    if (shouldHaveResults) assert.ok(answer.results.length > 0, query);
    if (shouldHaveResults === false) assert.equal(answer.results.length, 0, query);
  }
});

test("selector plurals and ordinary sentiment paraphrases keep their intended scope", async () => {
  const { engine } = await harness();
  const selectors = [
    ["What are the newest commentaries?", "commentary", "date", "ISDlaQ9DWSM"],
    ["What are the newest livestreams?", "livestream", "date", "LV2rmwEA0w4"],
    ["Which watchalongs drew the biggest audience?", "commentary", "views", "6VXSBDZ-3WE"],
    ["Which streams had the biggest audience?", "livestream", "views", "jG93HvyP420"],
  ];
  for (const [query, source, metric, sourceId] of selectors) {
    const answer = ask(engine, query);
    assert.equal(answer.source, source, query);
    assert.equal(answer.metric, metric, query);
    assert.equal(answer.results[0].sourceId, sourceId, query);
  }

  const negative = ask(engine, "What did they dislike about the Elm Street remake?");
  assert.equal(negative.intent, "negative");
  assert.ok(negative.results.every((result) => result.category === "FRANCHISE FELONY"));

  const positive = ask(engine, "What did they praise about Halloween?");
  assert.equal(positive.intent, "positive");
  assert.ok(positive.results.every((result) => result.category === "LOVE LETTER"));

  const neutral = ask(engine, "What did they make of Halloween?");
  assert.equal(neutral.intent, "opinion");
  assert.equal(neutral.status, "archive-boundary");
});
