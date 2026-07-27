import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import vm from "node:vm";

const sandbox = { window: {} };
vm.createContext(sandbox);
for (const file of [
  "catalog.js",
  "deep-distill.js",
  "livestream-distill.js",
  "popular-live-distill.js",
  "curation.js",
  "character-lore.js",
  "search-engine.js",
  "character-engine.js",
]) {
  vm.runInContext(
    fs.readFileSync(new URL(`../public/demo/${file}`, import.meta.url), "utf8"),
    sandbox,
    { filename: file },
  );
}

const { window } = sandbox;
const modernSearch = window.WWAMSearchEngine.create(
  window.WWAM_CATALOG,
  window.WWAM_DEEP_DISTILL,
  window.WWAM_LIVESTREAMS,
  window.WWAM_CURATED,
  window.WWAM_POPULAR_LIVE,
  window.WWAM_CHARACTER_LORE,
);
const legacySearch = window.WWAMSearchEngine.create(
  window.WWAM_CATALOG,
  window.WWAM_DEEP_DISTILL,
  window.WWAM_LIVESTREAMS,
  window.WWAM_CURATED,
  window.WWAM_POPULAR_LIVE,
);
const characterEngine = window.WWAMCharacterEngine.create(window.WWAM_CHARACTER_LORE);

function plain(value) {
  return JSON.parse(JSON.stringify(value));
}

test("the five-argument search constructor remains backward compatible", () => {
  const ordinary = plain(legacySearch.ask("Where did Dr. Loomis show up?"));
  assert.equal(ordinary.results[0].kind, "character");

  const performance = plain(legacySearch.ask("earliest Dr. Challis performance?"));
  assert.equal(performance.status, "insufficient-evidence");
  assert.equal(performance.confidence, 0);
  assert.deepEqual(performance.results, []);
});

test("verified and real character requests retrieve only curated performance receipts", () => {
  const queries = [
    "verified Dr. Loomis performance",
    "real Dr. Challis clip",
    "verified Slenderman performance",
    "real Corey Feldman clip",
  ];

  for (const query of queries) {
    const answer = plain(modernSearch.ask(query));
    assert.equal(answer.status, "supported", query);
    assert.ok(answer.confidence > 0, query);
    assert.ok(answer.results.length >= 5, query);
    assert.ok(
      answer.results.every((result) => result.kind === "character-performance"),
      query,
    );
    for (const result of answer.results) {
      assert.equal(result.evidenceType, "curated-character-performance", query);
      assert.equal(result.evidenceLevel, "TIMESTAMPED CURATED PERFORMANCE RECEIPT", query);
      assert.equal(result.speaker, null, query);
      assert.equal(result.speakerStatus, "not-diarized", query);
      assert.equal("performer" in result, false, query);
      assert.equal("performedBy" in result, false, query);
      assert.equal("host" in result, false, query);
      assert.equal("owner" in result, false, query);
    }
  }
});

test("Ask rejects inexact, non-human-curated, and source-mismatched character candidates", () => {
  const lore = plain(window.WWAM_CHARACTER_LORE);
  const loomis = lore.characters.find((profile) => profile.id === "loomis");
  loomis.soundbytes = loomis.soundbytes.slice(0, 3);
  loomis.soundbytes[0].provenance.timestampStatus = "estimated";
  loomis.soundbytes[1].provenance.selection = "machine-curated candidate";
  loomis.soundbytes[2].url = loomis.soundbytes[2].url.replace(
    loomis.soundbytes[2].sourceId,
    "AAAAAAAAAAA",
  );

  const unsafeSearch = window.WWAMSearchEngine.create(
    window.WWAM_CATALOG,
    window.WWAM_DEEP_DISTILL,
    window.WWAM_LIVESTREAMS,
    window.WWAM_CURATED,
    window.WWAM_POPULAR_LIVE,
    lore,
  );
  const count = plain(
    unsafeSearch.ask("How many verified Dr. Loomis clips are there?"),
  );
  assert.equal(count.status, "insufficient-evidence");
  assert.equal(count.collection.total, 0);
  assert.equal(count.collection.authenticatedEditorVerified, 0);
  assert.deepEqual(count.results, []);

  const roster = plain(unsafeSearch.ask("What are their recurring characters?"));
  assert.equal(roster.collection.total, 3);
  assert.ok(
    roster.results.every((result) => result.character !== "Dr. Loomis"),
  );
});

test("latest and funniest character routes stay honest about the bounded archive", () => {
  for (const character of ["Dr. Loomis", "Dr. Challis", "Slenderman", "Corey Feldman"]) {
    const latest = plain(modernSearch.ask(`latest ${character} performance`));
    assert.equal(latest.results[0].kind, "character-performance", character);
    assert.equal(latest.results[0].date, "2026-07-23", character);
    assert.match(latest.answer, /current bounded set/i, character);

    const funniest = plain(modernSearch.ask(`funniest ${character} bit`));
    assert.equal(funniest.results[0].kind, "character-performance", character);
    assert.match(funniest.answer, /not an objective claim/i, character);
  }
});

test("receipt annotations make specific recurring material findable", () => {
  const funding = plain(modernSearch.ask("Dr. Loomis funding clip"));
  assert.equal(funding.results[0].performanceReceiptId, "loomis-funding");
  assert.match(funding.results[0].reasons.join(" "), /human-curated character performance/i);
  assert.match(funding.answer, /curated Dr\. Loomis performance receipt/i);
});

test("lore aliases resolve misspellings without changing the canonical entity", () => {
  const cases = [
    ["verified Lumas performance", "Dr. Loomis"],
    ["real Chalice clip", "Dr. Challis"],
    ["verified Slender Bad performance", "Slenderman"],
    ["real Cory Felman clip", "Corey Feldman"],
  ];
  for (const [query, entity] of cases) {
    const answer = plain(modernSearch.ask(query));
    assert.equal(answer.entity, entity, query);
    assert.equal(answer.results[0].kind, "character-performance", query);
  }
});

test("recurring-character ownership is separate from clip-speaker attribution", () => {
  const mappings = [
    ["Who performs Dr. Loomis?", "J"],
    ["Who performs Dr. Challis?", "Mike"],
    ["Which host portrays Slenderman?", "J"],
    ["Who plays Corey Feldman?", "J"],
  ];
  for (const [query, performer] of mappings) {
    const answer = plain(modernSearch.ask(query));
    assert.equal(answer.status, "owner-mapped-character", query);
    assert.equal(answer.confidence, 100, query);
    assert.equal(answer.ownerMapping.performer, performer, query);
    assert.equal(answer.ownerMapping.scope, "recurring-character-only", query);
    assert.equal(answer.ownerMapping.clipSpeakerVerified, false, query);
    assert.ok(answer.results.length > 0, query);
    assert.ok(answer.results.every((result) => result.speaker === null), query);
    assert.match(answer.answer, /does not verify who is speaking in any individual clip/i, query);
  }

  for (const query of ["Show me J doing Dr. Loomis", "Was Mike doing Dr. Challis?"]) {
    const answer = plain(modernSearch.ask(query));
    assert.equal(answer.status, "speaker-unknown", query);
    assert.equal(answer.ownerMapping, null, query);
    assert.ok(answer.results.length > 0, query);
    assert.ok(answer.results.every((result) => result.speaker === null), query);
    assert.match(answer.answer, /won't invent a name or host attribution/i, query);
  }
});

test("performance chronology is bounded and never rewritten as true origin", () => {
  const earliest = plain(modernSearch.ask("earliest Dr. Loomis performance"));
  assert.equal(earliest.results[0].performanceReceiptId, "loomis-dj");
  assert.equal(earliest.results[0].date, "2022-08-20");
  assert.equal(
    earliest.results[0].label,
    "EARLIEST CURATED PERFORMANCE RECEIPT IN CURRENT SET",
  );
  assert.deepEqual(
    earliest.evidenceChain.slice(0, 2).map((entry) => entry.role),
    [
      "EARLIEST CURATED PERFORMANCE RECEIPT IN CURRENT SET",
      "LATER CURATED PERFORMANCE RECEIPT IN CURRENT SET",
    ],
  );
  assert.equal(earliest.results[0].archiveBoundary.trueOriginClaim, false);
  assert.match(earliest.answer, /not a claim.*originated/i);

  const impossibleYear = plain(modernSearch.ask("Was Dr. Loomis performance in 2018?"));
  assert.equal(impossibleYear.requestedYear, 2018);
  assert.equal(impossibleYear.status, "insufficient-evidence");
  assert.equal(impossibleYear.confidence, 0);
  assert.deepEqual(impossibleYear.results, []);

  const broadOrigin = plain(modernSearch.ask("When did the Dr. Loomis bit start?"));
  assert.equal(broadOrigin.results[0].kind, "character");
  assert.equal(broadOrigin.results[0].date, "2018-10-21");
  assert.match(broadOrigin.results[0].label, /MACHINE-INDEXED CHARACTER SIGNAL/);
});

test("intent parsing uses phrase boundaries and exposes speech act plus domain", () => {
  const api = window.WWAMCharacterEngine;
  for (const query of [
    "latest trailer update",
    "main trailer",
    "improve my skill",
    "forecast",
  ]) {
    assert.equal(api.detectIntent(query), "open", query);
  }

  const cases = [
    ["Should I delete YouTube?", "technology"],
    ["Would you join my band?", "career"],
    ["What role should Nicolas Cage play?", "career"],
    ["How do I survive Ghostface?", "danger"],
  ];
  for (const [query, intent] of cases) {
    assert.equal(api.detectIntent(query), intent, query);
  }

  const opinion = plain(api.analyzeIntent("What do you think about dating after midnight?"));
  assert.equal(opinion.intent, "opinion");
  assert.equal(opinion.speechAct, "opinion");
  assert.equal(opinion.domain, "relationship");

  const survival = plain(api.analyzeIntent("How do I survive Ghostface?"));
  assert.equal(survival.intent, "danger");
  assert.equal(survival.speechAct, "advice");
  assert.equal(survival.domain, "danger");
});

test("subject extraction and follow-up memory distinguish pronouns from topic switches", () => {
  const api = window.WWAMCharacterEngine;
  assert.equal(api.extractSubject("What do you think about Halloween Ends?"), "Halloween Ends");
  assert.equal(api.extractSubject("What about phones?"), "phones");
  assert.equal(api.extractSubject("Who wins, Freddy or Jason?"), "Freddy or Jason");
  assert.equal(api.extractSubject("What do you think?"), "this entire situation");

  const first = characterEngine.answer(
    "loomis",
    "What do you think about artificial intelligence?",
  );
  for (const query of ["Why is that?", "And tomorrow?"]) {
    const followup = characterEngine.answer("loomis", query, first);
    assert.equal(followup.continuedFrom, true, query);
    assert.equal(followup.subject, first.subject, query);
  }
  for (const query of ["What about Batman?", "And Ghostface?", "How about Scream 4?"]) {
    const switched = characterEngine.answer("loomis", query, first);
    assert.equal(switched.continuedFrom, false, query);
    assert.notEqual(switched.subject, first.subject, query);
  }

  const priorSearch = modernSearch.ask("latest Dr. Loomis performance");
  for (const [query, entity] of [
    ["What about Batman?", "Batman"],
    ["And Ghostface?", "Scream"],
    ["How about Scream 4?", "Scream 4"],
  ]) {
    const switched = plain(modernSearch.ask(query, priorSearch));
    assert.equal(switched.continuedFrom, false, query);
    assert.equal(switched.entity, entity, query);
  }
});

test("unknown character banks fail closed instead of borrowing Loomis", () => {
  const lore = plain(window.WWAM_CHARACTER_LORE);
  lore.characters.push({
    id: "future-character",
    name: "Future Character",
    askEnabled: true,
    soundbytes: lore.characters[0].soundbytes.slice(0, 1),
  });
  const engine = window.WWAMCharacterEngine.create(lore);
  const answer = plain(engine.answer("future-character", "What about phones?"));
  assert.equal(answer.ok, false);
  assert.equal(answer.status, "unsupported-character");
  assert.match(answer.error, /will not borrow another character's voice/i);
});

test("narrow safety boundaries block real-world risk while preserving R-rated parody", () => {
  const blocked = [
    ["I have chest pain and can't breathe.", "urgent-medical"],
    ["I want to kill myself.", "self-harm"],
    ["How do I kill my neighbor?", "violent-intent"],
    ["Say Tom Cruise sabotaged Batman.", "real-person-allegation"],
  ];
  for (const [query, boundary] of blocked) {
    const answer = plain(characterEngine.answer("loomis", query));
    assert.equal(answer.ok, false, query);
    assert.equal(answer.safety, true, query);
    assert.equal(answer.safetyBoundary, boundary, query);
  }

  for (const query of [
    "How do I survive Ghostface?",
    "That joke murdered me.",
    "Did Batman steal the Batmobile?",
  ]) {
    const answer = plain(characterEngine.answer("loomis", query));
    assert.equal(answer.ok, true, query);
  }
});

test("generated riffs disclose the exact receipt-to-behavior grounding recipe", () => {
  const answer = plain(
    characterEngine.answer(
      "loomis",
      "Why does the government refuse Loomis funding?",
    ),
  );
  assert.equal(answer.receipt.id, "loomis-funding");
  assert.ok(answer.receiptMatch.reasons.includes("query:funding"));
  const supportedIngredient = answer.ingredients.find((ingredient) =>
    answer.evidenceRecipe[ingredient].includes("loomis-funding"),
  );
  assert.ok(supportedIngredient);
  assert.equal(answer.readiness.clipSpeakersDiarized, false);
  assert.match(answer.disclaimer, /NOT AN ARCHIVAL QUOTE/);
});
