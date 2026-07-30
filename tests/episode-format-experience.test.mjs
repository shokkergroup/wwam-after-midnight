import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");
const FACTS_PATH = path.join(
  ROOT,
  "public",
  "demo",
  "episode-facts-pilot.js",
);
const BATCH2_FACTS_PATH = path.join(
  ROOT,
  "public",
  "demo",
  "episode-facts-batch2.js",
);
const BATCH3_FACTS_PATH = path.join(
  ROOT,
  "public",
  "demo",
  "episode-facts-batch3.js",
);
const PRESENTER_PATH = path.join(
  ROOT,
  "public",
  "demo",
  "episode-format-experience.js",
);

function loadRuntime(options = {}) {
  const context = { window: {} };
  vm.createContext(context);
  if (options.withFacts !== false) {
    vm.runInContext(fs.readFileSync(FACTS_PATH, "utf8"), context, {
      filename: FACTS_PATH,
    });
  }
  vm.runInContext(fs.readFileSync(PRESENTER_PATH, "utf8"), context, {
    filename: PRESENTER_PATH,
  });
  return context.window;
}

function loadBatch2Runtime() {
  const context = { window: {} };
  vm.createContext(context);
  vm.runInContext(fs.readFileSync(BATCH2_FACTS_PATH, "utf8"), context, {
    filename: BATCH2_FACTS_PATH,
  });
  vm.runInContext(fs.readFileSync(PRESENTER_PATH, "utf8"), context, {
    filename: PRESENTER_PATH,
  });
  return context.window;
}

function loadAllFactsRuntime() {
  const context = { window: {} };
  vm.createContext(context);
  for (const file of [FACTS_PATH, BATCH2_FACTS_PATH, BATCH3_FACTS_PATH]) {
    vm.runInContext(fs.readFileSync(file, "utf8"), context, {
      filename: file,
    });
  }
  vm.runInContext(fs.readFileSync(PRESENTER_PATH, "utf8"), context, {
    filename: PRESENTER_PATH,
  });
  return context.window;
}

function plain(value) {
  return JSON.parse(JSON.stringify(value));
}

function recursiveKeys(value, keys = []) {
  if (!value || typeof value !== "object") return keys;
  if (Array.isArray(value)) {
    value.forEach((item) => recursiveKeys(item, keys));
    return keys;
  }
  for (const [key, nested] of Object.entries(value)) {
    keys.push(key);
    recursiveKeys(nested, keys);
  }
  return keys;
}

function factMap(source) {
  return new Map(
    source[source.formatSpecificFactType].map((fact) => [fact.id, fact]),
  );
}

const runtime = loadRuntime();
const facts = plain(runtime.WWAM_EPISODE_FACTS_PILOT);
const api = runtime.WWAM_EPISODE_FORMAT_EXPERIENCE;
const pack = plain(runtime.WWAM_EPISODE_FORMAT_VIEWS);
const batchRuntime = loadBatch2Runtime();
const batchFacts = plain(batchRuntime.WWAM_EPISODE_FACTS_BATCH2);
const batchApi = batchRuntime.WWAM_EPISODE_FORMAT_EXPERIENCE;
const batchPack = plain(batchApi.presentAll(batchFacts));
const allFactsRuntime = loadAllFactsRuntime();

test("attaches a standalone presenter and eagerly builds views when facts are present", () => {
  assert.equal(runtime.WWAMEpisodeFormatExperience, api);
  assert.equal(api.VERSION, "1.2.0");
  assert.equal(api.schema, "wwam-episode-format-experience/v1");
  assert.deepEqual(
    Object.keys(api),
    [
      "VERSION",
      "schema",
      "build",
      "formatTime",
      "presentSource",
      "presentAll",
      "getById",
      "fromWindow",
    ],
  );
  assert.equal(pack.schema, "wwam-episode-format-experience/v1");
  assert.equal(pack.sources, 12);
  assert.equal(pack.items, 55);
  assert.deepEqual(pack.modes, {
    "ranking-board": 4,
    "qa-desk": 3,
    "news-wire": 3,
    "script-spine": 1,
    "sync-desk": 1,
  });
});

test("exposes the deterministic integration build contract", () => {
  const view = plain(api.build(facts, "QMYgsEfPMg0"));
  assert.ok(view);
  for (const key of [
    "kind",
    "eyebrow",
    "title",
    "description",
    "boundary",
    "items",
  ]) {
    assert.ok(Object.hasOwn(view, key), key);
  }
  assert.equal(view.kind, "ranking-board");
  assert.equal(view.description, view.deck);
  assert.equal(view.boundary, view.boundaryCopy);
  assert.ok(view.items.length > 0);
  for (const item of view.items) {
    for (const key of [
      "id",
      "label",
      "topic",
      "summary",
      "at",
      "end",
      "excerpt",
      "meta",
    ]) {
      assert.ok(Object.hasOwn(item, key), `${item.id}:${key}`);
    }
    assert.equal(item.id, item.factId);
    assert.equal(item.meta.timecode, item.playback.timecode);
    assert.equal(item.meta.endTimecode, item.playback.endTimecode);
    assert.equal(item.meta.durationSeconds, item.end - item.at);
  }
  assert.equal(api.build(facts, "not-a-source"), null);
  assert.equal(api.build(null, "QMYgsEfPMg0"), null);
});

test("loads safely before the fact payload and can present later", () => {
  const emptyRuntime = loadRuntime({ withFacts: false });
  const emptyApi = emptyRuntime.WWAM_EPISODE_FORMAT_EXPERIENCE;
  assert.ok(emptyApi);
  assert.equal(emptyRuntime.WWAM_EPISODE_FORMAT_VIEWS, undefined);
  assert.equal(emptyApi.fromWindow("_PiftDXSf8k"), null);
  const built = plain(emptyApi.presentAll(facts));
  assert.equal(built.sources, 12);
  assert.equal(built.items, 55);
});

test("window lookup searches all three typed fact packs", () => {
  const allApi = allFactsRuntime.WWAM_EPISODE_FORMAT_EXPERIENCE;
  const batch3 = plain(allFactsRuntime.WWAM_EPISODE_FACTS_BATCH3);
  const sourceId = batch3.sources[0].id;
  assert.deepEqual(
    plain(allApi.fromWindow(sourceId)),
    plain(allApi.build(batch3, sourceId)),
  );
  assert.equal(allApi.fromWindow("not-a-source"), null);
});

test("maps the twelve sources into the five channel-native visitor desks", () => {
  const modeById = Object.fromEntries(
    pack.experiences.map((experience) => [
      experience.sourceId,
      experience.mode,
    ]),
  );
  assert.deepEqual(modeById, {
    _PiftDXSf8k: "ranking-board",
    ooLNfFkpH6M: "ranking-board",
    QMYgsEfPMg0: "ranking-board",
    cQAVmNFQmoI: "ranking-board",
    fUCQoxTwKqo: "qa-desk",
    xVUR68diEHQ: "qa-desk",
    "-k3YduzBoGs": "qa-desk",
    uoxOvi0J5zQ: "news-wire",
    wW9bdu_GtgQ: "news-wire",
    Ppb0cXyB3rk: "news-wire",
    "5T1wWUjCGWk": "script-spine",
    "3Lu5KPrQhc8": "sync-desk",
  });
  const titleByMode = Object.fromEntries(
    pack.experiences.map((experience) => [
      experience.sourceId,
      experience.title,
    ]),
  );
  assert.equal(titleByMode._PiftDXSf8k, "THE RANKING BOARD");
  assert.equal(titleByMode.cQAVmNFQmoI, "THE DUELING RANKING BOARD");
  assert.equal(titleByMode.fUCQoxTwKqo, "THE Q&A DESK");
  assert.equal(titleByMode["-k3YduzBoGs"], "THE REVIEW Q&A DESK");
  assert.equal(titleByMode.uoxOvi0J5zQ, "THE NEWS WIRE");
  assert.equal(titleByMode.Ppb0cXyB3rk, "THE BREAKDOWN WIRE");
  assert.equal(titleByMode["5T1wWUjCGWk"], "THE SCRIPT SPINE");
  assert.equal(titleByMode["3Lu5KPrQhc8"], "THE SYNC DESK");
});

test("preserves every typed fact id, bound, excerpt, and playback coordinate", () => {
  const sourceById = new Map(facts.sources.map((source) => [source.id, source]));
  for (const experience of pack.experiences) {
    const source = sourceById.get(experience.sourceId);
    const sourceFacts = factMap(source);
    assert.equal(experience.itemCount, sourceFacts.size, source.id);
    assert.equal(experience.items.length, sourceFacts.size, source.id);
    assert.equal(experience.sourceTitle, source.title, source.id);
    assert.equal(experience.duration, source.duration, source.id);
    for (const item of experience.items) {
      const fact = sourceFacts.get(item.factId);
      assert.ok(fact, item.factId);
      assert.equal(item.at, fact.at, item.factId);
      assert.equal(item.end, fact.end, item.factId);
      assert.equal(item.excerpt, fact.excerpt, item.factId);
      assert.deepEqual(
        item.playback,
        {
          sourceId: source.id,
          at: fact.at,
          end: fact.end,
          durationSeconds: fact.end - fact.at,
          timecode: plain(api.formatTime(fact.at)),
          endTimecode: plain(api.formatTime(fact.end)),
          url:
            "https://www.youtube.com/watch?v=" +
            encodeURIComponent(source.id) +
            "&t=" +
            fact.at +
            "s",
        },
        item.factId,
      );
    }
  }
});

test("keeps the four phase markers playable without leaking the fact contract", () => {
  const sourceById = new Map(facts.sources.map((source) => [source.id, source]));
  for (const experience of pack.experiences) {
    const source = sourceById.get(experience.sourceId);
    assert.equal(experience.phaseRail.length, 4, source.id);
    experience.phaseRail.forEach((item, index) => {
      const fact = source.phaseBoundaries[index];
      assert.equal(item.factId, fact.id, item.factId);
      assert.equal(item.at, fact.at, item.factId);
      assert.equal(item.end, fact.end, item.factId);
      assert.equal(item.excerpt, fact.excerpt, item.factId);
      assert.equal(item.playback.at, fact.at, item.factId);
      assert.equal(item.playback.end, fact.end, item.factId);
    });
  }
});

test("uses concise, honest one-sentence evidence boundaries", () => {
  const expected = {
    "ranking-list":
      "These are captioned ranking statements, not verified on-screen placements, and no speaker is assigned.",
    "parallel-ranking":
      "The two caption sequences stay separate, but the tape does not identify either speaker or verify an on-screen result.",
    "question-and-answer":
      "Each card joins a source-local question cue to a nearby response window without assigning a speaker or proving answer ownership.",
    "review-and-qa":
      "Each card joins a source-local question cue to a nearby response window without assigning a speaker or proving answer ownership.",
    "news-agenda":
      "These are exact captioned subject doors, not claims about importance, uninterrupted coverage, or a final opinion.",
    "trailer-breakdown":
      "These are exact captioned subject doors, not claims about importance, uninterrupted coverage, or a final opinion.",
    "script-reading":
      "These are captioned reading and scene-direction cues, while the source script, roles, and depicted visuals remain unverified.",
    "watchalong-commentary":
      "These are countdown and play-language cues, so verify the movie edition and frame sync before using them.",
  };
  const sourceById = new Map(facts.sources.map((source) => [source.id, source]));
  for (const experience of pack.experiences) {
    const source = sourceById.get(experience.sourceId);
    assert.equal(experience.boundaryCopy, expected[source.format], source.id);
    assert.match(experience.boundaryCopy, /^[A-Z].+\.$/, source.id);
    assert.equal(
      (experience.boundaryCopy.match(/[.!?](?:\s|$)/g) || []).length,
      1,
      source.id,
    );
  }
});

test("does not expose hashes, review machinery, confidence scores, or claim objects", () => {
  const serialized = JSON.stringify(pack);
  for (const forbidden of [
    "sha256:",
    "evidenceHash",
    "anchorSetSha256",
    "metadataSha256",
    "captionSha256",
    "machine-surfaced",
    "needs-editor-review",
    "reviewState",
    "confidence",
    "promotionAllowed",
    '"claim":',
  ]) {
    assert.doesNotMatch(serialized, new RegExp(forbidden, "i"), forbidden);
  }
  const keys = recursiveKeys(pack);
  assert.equal(
    keys.some((key) =>
      /^(?:speaker|speakerId|speakerName|performer|visualResult|ballotOwner)$/i.test(
        key,
      ),
    ),
    false,
  );
});

test("renders ranking cards without merging the parallel ballots", () => {
  const mafia = pack.experiences.find(
    (experience) => experience.sourceId === "_PiftDXSf8k",
  );
  assert.deepEqual(
    mafia.items.map((item) => [item.label, item.title, item.playback.timecode]),
    [
      ["BOARD RULE", "MOVIES, NOT CHARACTERS", "9:03"],
      ["RANK #3", "CASINO // THIRD", "31:26"],
      ["RANKING STOP", "FOURTH PICK SETUP", "42:08"],
      ["RANK #4", "SCARFACE // FOURTH", "42:14"],
      ["NEW BOARD", "CHARACTER LIST BEGINS", "1:08:27"],
      ["CHARACTER LIST", "MICHAEL CORLEONE", "1:09:28"],
    ],
  );

  const ballots = pack.experiences.find(
    (experience) => experience.sourceId === "cQAVmNFQmoI",
  );
  const rankFour = ballots.items.filter((item) => item.position === 4);
  const rankTwo = ballots.items.filter((item) => item.position === 2);
  assert.deepEqual(
    rankFour.map((item) => [item.subject, item.ballot, item.label]),
    [
      ["Alien", "A", "BALLOT A"],
      ["The Terminator", "B", "BALLOT B"],
    ],
  );
  assert.deepEqual(
    rankTwo.map((item) => [item.subject, item.ballot, item.label]),
    [
      ["Terminator 2", "A", "BALLOT A"],
      ["Predator", "B", "BALLOT B"],
    ],
  );
});

test("renders the Q&A desk with distinct playable question and response windows", () => {
  const qa = pack.experiences.find(
    (experience) => experience.sourceId === "fUCQoxTwKqo",
  );
  assert.equal(qa.items[0].title, "CANCELLED HEELS QUESTION");
  assert.equal(qa.items[0].question.at, 582);
  assert.equal(qa.items[0].question.excerpt, "good question uh he says it's worth");
  assert.equal(qa.items[0].response.at, 587);
  assert.match(qa.items[0].response.excerpt, /wrestling fan/i);
  assert.equal(qa.items[0].question.playback.at, 582);
  assert.equal(qa.items[0].response.playback.at, 587);
  assert.match(qa.items[0].summary, /question cue.*9:42/i);
  assert.match(qa.items[0].summary, /response window.*9:47/i);
});

test("renders exact news doors, script cues, and watchalong sync stops", () => {
  const news = pack.experiences.find(
    (experience) => experience.sourceId === "wW9bdu_GtgQ",
  );
  assert.deepEqual(
    news.items.map((item) => [
      item.title,
      item.subject,
      item.at,
      item.secondSignalAt,
    ]),
    [
      ["INSIDIOUS: THE RED DOOR", "Insidious: The Red Door", 122, null],
      ["SCREAM NEWS", "Scream news", 1878, 1992],
      ["EVIL DEAD RISE", "Evil Dead Rise", 2485, 2497],
    ],
  );

  const script = pack.experiences.find(
    (experience) => experience.sourceId === "5T1wWUjCGWk",
  );
  assert.deepEqual(
    script.items.map((item) => [item.label, item.at]),
    [
      ["SETUP", 32],
      ["SCRIPT NOTE", 536],
      ["READING START", 597],
      ["OPENING LINE", 602],
      ["SCENE DIRECTION", 614],
    ],
  );

  const sync = pack.experiences.find(
    (experience) => experience.sourceId === "3Lu5KPrQhc8",
  );
  assert.deepEqual(
    sync.items.map((item) => [item.label, item.at, item.excerpt]),
    [
      [
        "START SETUP",
        344,
        "we're gonna start Bride of Chucky so if",
      ],
      ["COUNTDOWN", 372, "Bride of Chucky in 321 how we do three G"],
      [
        "PRESS PLAY",
        378,
        "press play on Bride of Chucky in this",
      ],
    ],
  );
});

test("returns deterministic views and a null-safe source lookup", () => {
  const first = plain(api.presentAll(facts));
  const second = plain(api.presentAll(facts));
  assert.deepEqual(first, pack);
  assert.deepEqual(second, pack);
  assert.deepEqual(first, second);
  assert.deepEqual(
    plain(api.getById(facts, "QMYgsEfPMg0")),
    pack.experiences.find(
      (experience) => experience.sourceId === "QMYgsEfPMg0",
    ),
  );
  assert.equal(api.getById(facts, "not-a-source"), null);
  assert.throws(
    () => api.presentSource({ id: "x", title: "Bad", format: "unknown" }),
    /Unsupported episode format/,
  );
});

test("presents all batch-two formats without changing their typed fact counts", () => {
  assert.equal(batchApi.VERSION, "1.2.0");
  assert.equal(batchPack.sources, 12);
  assert.equal(batchPack.items, 137);
  assert.deepEqual(batchPack.modes, {
    "ranking-board": 3,
    "qa-desk": 1,
    "news-wire": 2,
    "script-spine": 1,
    "sync-desk": 1,
    "review-desk": 3,
    "recap-desk": 1,
  });
});

test("turns captioned reviews into a claim-aware desk with distinct saved scores", () => {
  const source = batchFacts.sources.find(
    (candidate) => candidate.id === "QwJb31dSo9Y",
  );
  const view = plain(batchApi.build(batchFacts, source.id));
  assert.equal(view.kind, "review-desk");
  assert.equal(view.mode, "review-desk");
  assert.equal(view.navLabel, "REVIEW DESK");
  assert.equal(view.title, "THE REVIEW DESK");
  assert.equal(view.itemCount, 15);
  assert.equal(
    view.boundary,
    "These cards restate captioned review language from this source without identifying a speaker or certifying any depicted scene.",
  );

  const flashbackFact = source.reviewMoments.find(
    (fact) => fact.label === "FLASHBACK // 10 OUT OF 10",
  );
  const flashback = view.items.find(
    (item) => item.factId === flashbackFact.id,
  );
  assert.equal(flashback.label, "SECTION SCORE // 10 OUT OF 10");
  assert.equal(flashback.moment, "SECTION SCORE");
  assert.equal(flashback.tone, "POSITIVE");
  assert.equal(flashback.score, "10 out of 10");
  assert.equal(flashback.summary, flashbackFact.claim.text);

  const verdicts = view.items.filter((item) => item.moment === "VERDICT");
  assert.equal(verdicts.length, 3);
  const scoredVerdicts = verdicts.filter((item) => item.score);
  assert.deepEqual(
    scoredVerdicts.map((item) => [
      item.title,
      item.label,
      item.score,
      item.playback.at,
    ]),
    [
      ["OVERALL // 8", "VERDICT // 8 OUT OF 10", "8 out of 10", 3713],
      ["OVERALL // 9", "VERDICT // 9 OUT OF 10", "9 out of 10", 3726],
    ],
  );
  assert.notEqual(scoredVerdicts[0].factId, scoredVerdicts[1].factId);
});

test("gives the Welcome to Derry recap a theory-safe beat and verdict rail", () => {
  const source = batchFacts.sources.find(
    (candidate) => candidate.id === "rtWl8c57SYk",
  );
  const view = plain(batchApi.build(batchFacts, source.id));
  assert.equal(view.kind, "recap-desk");
  assert.equal(view.mode, "recap-desk");
  assert.equal(view.navLabel, "EPISODE RECAP");
  assert.equal(view.title, "THE EPISODE RECAP");
  assert.equal(view.itemCount, 11);
  assert.equal(
    view.boundary,
    "These cards restate captioned recap language from this source while keeping theories tentative and speakers and depicted scenes unverified.",
  );

  const theoryFact = source.reviewMoments.find(
    (fact) => fact.label === "EPISODE-TWO DREAM-SEQUENCE LINE",
  );
  const theory = view.items.find((item) => item.factId === theoryFact.id);
  assert.equal(theory.label, "THEORY");
  assert.equal(theory.moment, "THEORY");
  assert.equal(theory.tone, "NEGATIVE THEORY");
  assert.equal(theory.summary, theoryFact.claim.text);

  const verdictFact = source.reviewMoments.find(
    (fact) => fact.label === "FINAL EPISODE VERDICT",
  );
  const verdict = view.items.find((item) => item.factId === verdictFact.id);
  assert.equal(verdict.label, "VERDICT");
  assert.equal(verdict.moment, "VERDICT");
  assert.equal(verdict.tone, "POSITIVE");
  assert.equal(verdict.summary, verdictFact.claim.text);
});

test("keeps every review and recap card on its exact bounded source receipt", () => {
  const relevantSources = batchFacts.sources.filter((source) =>
    ["review-desk", "episode-recap"].includes(source.format),
  );
  for (const source of relevantSources) {
    const view = plain(batchApi.build(batchFacts, source.id));
    const factsById = factMap(source);
    assert.equal(view.items.length, factsById.size, source.id);
    for (const item of view.items) {
      const fact = factsById.get(item.factId);
      assert.ok(fact, item.factId);
      assert.equal(item.at, fact.at, item.factId);
      assert.equal(item.end, fact.end, item.factId);
      assert.equal(item.excerpt, fact.excerpt, item.factId);
      assert.equal(item.summary, fact.claim.text, item.factId);
      assert.deepEqual(
        item.playback,
        {
          sourceId: source.id,
          at: fact.at,
          end: fact.end,
          durationSeconds: fact.end - fact.at,
          timecode: plain(batchApi.formatTime(fact.at)),
          endTimecode: plain(batchApi.formatTime(fact.end)),
          url:
            "https://www.youtube.com/watch?v=" +
            encodeURIComponent(source.id) +
            "&t=" +
            fact.at +
            "s",
        },
        item.factId,
      );
    }
  }
});

test("keeps batch-two review internals and unsupported identity claims out of visitor views", () => {
  const reviewViews = batchPack.experiences.filter((experience) =>
    ["review-desk", "recap-desk"].includes(experience.mode),
  );
  const serialized = JSON.stringify(reviewViews);
  for (const forbidden of [
    "sha256:",
    "evidenceHash",
    "reviewState",
    "confidence",
    "promotionAllowed",
    '"claim":',
  ]) {
    assert.doesNotMatch(serialized, new RegExp(forbidden, "i"), forbidden);
  }
  const keys = recursiveKeys(reviewViews);
  assert.equal(
    keys.some((key) =>
      /^(?:speaker|speakerId|speakerName|performer|visualResult|creatorApproval)$/i.test(
        key,
      ),
    ),
    false,
  );
});
