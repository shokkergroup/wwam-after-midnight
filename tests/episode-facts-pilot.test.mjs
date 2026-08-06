import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

import {
  buildPilotPayload,
  parseCaptionLines,
  renderArtifact,
  resolveAnchor,
} from "../scripts/generate-episode-facts-pilot.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");
const ARTIFACT = path.join(
  ROOT,
  "public",
  "demo",
  "episode-facts-pilot.js",
);
const EXPECTED_IDS = [
  "_PiftDXSf8k",
  "ooLNfFkpH6M",
  "QMYgsEfPMg0",
  "cQAVmNFQmoI",
  "fUCQoxTwKqo",
  "xVUR68diEHQ",
  "-k3YduzBoGs",
  "uoxOvi0J5zQ",
  "wW9bdu_GtgQ",
  "Ppb0cXyB3rk",
  "5T1wWUjCGWk",
  "3Lu5KPrQhc8",
];

function loadArtifact() {
  const context = { window: {} };
  vm.createContext(context);
  vm.runInContext(fs.readFileSync(ARTIFACT, "utf8"), context, {
    filename: ARTIFACT,
  });
  return JSON.parse(
    JSON.stringify(context.window.WWAM_EPISODE_FACTS_PILOT),
  );
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

function sha256(value) {
  return `sha256:${crypto
    .createHash("sha256")
    .update(String(value))
    .digest("hex")}`;
}

function words(value) {
  return String(value || "").match(/[A-Za-z0-9]+(?:['-][A-Za-z0-9]+)*/g) || [];
}

function normalized(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function allFacts(source) {
  return [
    ...source.phaseBoundaries,
    ...source.topicRuns,
    ...source.localReelAnchors,
    ...source[source.formatSpecificFactType],
  ];
}

const payload = loadArtifact();

test("publishes exactly the twelve requested format-diverse source fact packs", () => {
  assert.equal(payload.schema, "wwam-episode-facts-pilot/v1");
  assert.deepEqual(
    payload.sources.map((source) => source.id),
    EXPECTED_IDS,
  );
  assert.equal(payload.meta.sources, 12);
  assert.equal(payload.meta.facts, 328);
  assert.deepEqual(payload.meta.byType, {
    phaseBoundary: 48,
    topicRun: 99,
    localReelAnchor: 124,
    rankingEvent: 34,
    questionAnswerPair: 5,
    agendaItem: 10,
    scriptSceneCue: 5,
    syncCue: 3,
  });
  assert.equal(payload.policy.privateCaptionCacheUsed, true);
  assert.equal(payload.policy.publicFullCaptionsIncluded, false);
  assert.equal(payload.policy.speakerAttributionAllowed, false);
  assert.equal(payload.policy.visualResultInferenceAllowed, false);
});

test("gives every source the common fact lanes and only its typed format lane", () => {
  const expectedSpecific = {
    _PiftDXSf8k: "rankingEvents",
    ooLNfFkpH6M: "rankingEvents",
    QMYgsEfPMg0: "rankingEvents",
    cQAVmNFQmoI: "rankingEvents",
    fUCQoxTwKqo: "questionAnswerPairs",
    xVUR68diEHQ: "questionAnswerPairs",
    "-k3YduzBoGs": "questionAnswerPairs",
    uoxOvi0J5zQ: "agendaItems",
    wW9bdu_GtgQ: "agendaItems",
    Ppb0cXyB3rk: "agendaItems",
    "5T1wWUjCGWk": "scriptSceneCues",
    "3Lu5KPrQhc8": "syncCues",
  };
  for (const source of payload.sources) {
    assert.equal(source.formatSpecificFactType, expectedSpecific[source.id]);
    assert.equal(source.phaseBoundaries.length, 4, source.id);
    assert.ok(source.topicRuns.length >= 5, source.id);
    assert.ok(source.localReelAnchors.length >= 8, source.id);
    assert.ok(source[source.formatSpecificFactType].length >= 1, source.id);
    assert.equal(source.sourceState.speakerDiarized, false, source.id);
    assert.equal(source.sourceState.promotionAllowed, false, source.id);
  }
});

test("keeps every fact timestamped, bounded, speaker-neutral, and rights-safe", () => {
  for (const source of payload.sources) {
    const ids = new Set();
    for (const fact of allFacts(source)) {
      assert.ok(!ids.has(fact.id), fact.id);
      ids.add(fact.id);
      assert.ok(fact.at >= 0, fact.id);
      assert.ok(fact.end > fact.at, fact.id);
      assert.ok(fact.end <= source.duration + 5, fact.id);
      assert.ok(words(fact.excerpt).length >= 1, fact.id);
      assert.ok(words(fact.excerpt).length <= 16, fact.id);
      assert.match(fact.evidenceHash, /^sha256:[a-f0-9]{64}$/, fact.id);
      assert.equal(fact.evidenceType, "youtube-automatic-caption", fact.id);
      assert.ok(["high", "medium"].includes(fact.confidence), fact.id);
      assert.equal(
        fact.reviewState,
        "machine-surfaced-needs-editor-review",
        fact.id,
      );
      assert.equal(fact.speaker, null, fact.id);
      assert.equal(fact.claim.kind, "caption-observation", fact.id);
      assert.equal(fact.claim.scope, "source-local", fact.id);
      assert.equal(fact.claim.rightsSafe, true, fact.id);
      for (const key of [
        "speakerClaim",
        "performerClaim",
        "visualResultClaim",
        "intentClaim",
        "originClaim",
        "editorialVerdictClaim",
      ]) {
        assert.equal(fact.claim[key], false, `${fact.id}:${key}`);
      }
      assert.ok(fact.evidence.anchorPhrase, fact.id);
      assert.ok(fact.evidence.anchorAt >= 0, fact.id);
      assert.ok(fact.evidence.anchorEnd > fact.evidence.anchorAt, fact.id);
      assert.ok(fact.evidence.excerptWordCount <= 16, fact.id);
      assert.equal(fact.evidence.fullCaptionPublic, false, fact.id);
      assert.equal(fact.evidence.speakerDiarized, false, fact.id);
      assert.equal(fact.evidence.promotionAllowed, false, fact.id);
      for (const support of fact.supportEvidence || []) {
        assert.ok(support.at >= 0, fact.id);
        assert.ok(support.end > support.at, fact.id);
        assert.ok(words(support.excerpt).length <= 16, fact.id);
        assert.match(support.hash, /^sha256:[a-f0-9]{64}$/, fact.id);
      }
    }
  }
});

test("re-resolves every public fact anchor against the private local caption cache", () => {
  for (const source of payload.sources) {
    const caption = JSON.parse(
      fs.readFileSync(
        path.join(ROOT, "source-cache", "captions", `${source.id}.json`),
        "utf8",
      ),
    );
    const lines = parseCaptionLines(caption);
    for (const fact of allFacts(source)) {
      const line = resolveAnchor(
        lines,
        fact.evidence.anchorAt,
        fact.evidence.anchorPhrase,
        0,
      );
      assert.equal(line.at, fact.evidence.anchorAt, fact.id);
      assert.ok(
        normalized(line.text).includes(
          normalized(fact.evidence.anchorPhrase),
        ),
        fact.id,
      );
      if (fact.type === "topicRun") {
        assert.ok(
          fact.evidenceAt >= fact.at && fact.evidenceEnd <= fact.end,
          fact.id,
        );
        assert.equal(fact.runContinuityClaimed, false, fact.id);
        assert.ok(fact.end - fact.at <= 240, fact.id);
      }
      if (fact.type === "localReelAnchor" && fact.binFrom !== undefined) {
        assert.ok(fact.at >= fact.binFrom, fact.id);
        assert.ok(fact.at < fact.binTo, fact.id);
      }
      if (fact.type === "questionAnswerPair") {
        assert.ok(fact.questionEvidence.at >= fact.at, fact.id);
        assert.ok(fact.responseEvidence.end <= fact.end, fact.id);
        assert.ok(words(fact.questionEvidence.excerpt).length <= 16, fact.id);
        assert.ok(words(fact.responseEvidence.excerpt).length <= 16, fact.id);
        assert.match(
          fact.questionEvidence.hash,
          /^sha256:[a-f0-9]{64}$/,
          fact.id,
        );
        assert.match(
          fact.responseEvidence.hash,
          /^sha256:[a-f0-9]{64}$/,
          fact.id,
        );
        assert.equal(fact.answerOwner, null, fact.id);
        assert.equal(fact.answerSemanticsHumanVerified, false, fact.id);
      }
    }
  }
});

test("preserves the audited ranking checkpoints without merging parallel ballots", () => {
  const byId = new Map(payload.sources.map((source) => [source.id, source]));
  const mountRushmore = byId.get("_PiftDXSf8k").rankingEvents;
  assert.deepEqual(
    mountRushmore.map((fact) => fact.label),
    [
      "MOVIES, NOT CHARACTERS",
      "CASINO // THIRD",
      "FOURTH PICK SETUP",
      "SCARFACE // FOURTH",
      "CHARACTER LIST BEGINS",
      "MICHAEL CORLEONE",
    ],
  );
  assert.equal(mountRushmore.find((fact) => fact.subject === "Casino").position, 3);
  assert.equal(mountRushmore.find((fact) => fact.subject === "Scarface").position, 4);

  const horrorTier = byId.get("ooLNfFkpH6M").rankingEvents;
  assert.ok(
    horrorTier.some(
      (fact) =>
        fact.subject === "Scream" && fact.placementLanguage === "alltime",
    ),
  );
  assert.ok(
    horrorTier.some(
      (fact) =>
        fact.subject === "Saw" && fact.placementLanguage === "pretty rad",
    ),
  );
  assert.ok(
    horrorTier.some(
      (fact) =>
        fact.subject === "Halloween" &&
        fact.placementLanguage === "alltime",
    ),
  );
  assert.ok(
    horrorTier.some(
      (fact) =>
        fact.subject === "Final Destination" &&
        fact.placementLanguage === "almost touches the sun" &&
        fact.visualResultVerified === false,
    ),
  );

  const christmas = byId.get("QMYgsEfPMg0").rankingEvents;
  assert.equal(christmas.find((fact) => fact.label === "NEWS BEFORE THE LIST").at, 1032);
  assert.equal(christmas.find((fact) => fact.label === "CHRISTMAS LIST START").at, 2092);
  assert.ok(christmas.some((fact) => fact.subject === "Home Alone 2"));
  assert.ok(
    christmas.some(
      (fact) =>
        fact.subject === "The Grinch" &&
        fact.placementLanguage === "almost touches the sun",
    ),
  );

  const ballots = byId.get("cQAVmNFQmoI").rankingEvents;
  const rankFour = ballots.filter((fact) => fact.position === 4);
  const rankTwo = ballots.filter((fact) => fact.position === 2);
  assert.deepEqual(
    rankFour.map((fact) => [fact.subject, fact.sequenceLane]),
    [
      ["Alien", "caption-ballot-a"],
      ["The Terminator", "caption-ballot-b"],
    ],
  );
  assert.deepEqual(
    rankTwo.map((fact) => [fact.subject, fact.sequenceLane]),
    [
      ["Terminator 2", "caption-ballot-a"],
      ["Predator", "caption-ballot-b"],
    ],
  );
  assert.ok(
    ballots.some(
      (fact) =>
        fact.subject === "Terminator 2" &&
        fact.position === 1 &&
        fact.sequenceLane === "caption-ballot-b",
    ),
  );
  assert.ok(ballots.every((fact) => fact.ballotOwner === null));
});

test("preserves the audited Q&A pairings while refusing speaker ownership", () => {
  const byId = new Map(payload.sources.map((source) => [source.id, source]));
  const halloweenQa = byId.get("fUCQoxTwKqo");
  assert.deepEqual(
    halloweenQa.questionAnswerPairs.map((fact) => fact.label),
    ["CANCELLED HEELS QUESTION", "TWIX OR SNICKERS"],
  );
  assert.equal(halloweenQa.questionAnswerPairs[0].at, 582);
  assert.match(
    halloweenQa.questionAnswerPairs[0].responseEvidence.excerpt,
    /wrestling fan/i,
  );
  assert.ok(
    halloweenQa.localReelAnchors.some(
      (fact) =>
        fact.label === "A24 / HALLOWEEN CRAFT RUN" &&
        fact.at === 917 &&
        fact.end >= 965,
    ),
  );

  const milestone = byId.get("xVUR68diEHQ").questionAnswerPairs;
  assert.equal(milestone[0].at, 823);
  assert.match(milestone[0].responseEvidence.excerpt, /love the absolute/i);
  assert.equal(milestone[1].at, 5070);
  assert.equal(milestone[1].answerOwner, null);

  const earlyReview = byId.get("-k3YduzBoGs");
  assert.ok(
    earlyReview.localReelAnchors.some(
      (fact) => fact.label === "REVIEW TO Q&A HANDOFF" && fact.at === 1796,
    ),
  );
  assert.equal(earlyReview.questionAnswerPairs[0].at, 2687);
  assert.match(
    earlyReview.questionAnswerPairs[0].responseEvidence.excerpt,
    /really good/i,
  );
});

test("keeps news, trailer, script, and watchalong cues source-local", () => {
  const byId = new Map(payload.sources.map((source) => [source.id, source]));
  assert.deepEqual(
    byId.get("wW9bdu_GtgQ").agendaItems.map((fact) => fact.subject),
    ["Insidious: The Red Door", "Scream news", "Evil Dead Rise"],
  );
  assert.deepEqual(
    byId.get("uoxOvi0J5zQ").agendaItems.map((fact) => fact.subject),
    ["The Flash", "The Flash trailer", "Alien Day"],
  );

  const scream = byId
    .get("Ppb0cXyB3rk")
    .topicRuns.find((fact) => fact.topic === "Scream");
  assert.ok(scream);
  assert.equal(scream.episodeMatches, 101);
  assert.deepEqual(
    byId.get("Ppb0cXyB3rk").agendaItems.map((fact) => fact.subject),
    ["Fan theory", "Final trailer", "Box office", "Streaming"],
  );

  const script = byId.get("5T1wWUjCGWk").scriptSceneCues;
  assert.deepEqual(
    script.map((fact) => fact.at),
    [32, 536, 597, 602, 614],
  );
  assert.ok(script.every((fact) => fact.sourceScriptOriginVerified === false));
  assert.ok(script.every((fact) => fact.frameMatchVerified === false));

  const sync = byId.get("3Lu5KPrQhc8").syncCues;
  assert.deepEqual(
    sync.map((fact) => fact.at),
    [344, 372, 378],
  );
  assert.ok(sync.every((fact) => fact.playbackStateVerified === false));
  assert.ok(sync.every((fact) => fact.frameMatchVerified === false));
});

test("records deterministic input, fact-pack, and whole-artifact hashes", () => {
  for (const source of payload.sources) {
    assert.match(
      source.inputEvidence.captionSha256,
      /^sha256:[a-f0-9]{64}$/,
      source.id,
    );
    assert.match(
      source.inputEvidence.metadataSha256,
      /^sha256:[a-f0-9]{64}$/,
      source.id,
    );
    assert.equal(
      source.inputEvidence.anchorAudit.required,
      source.inputEvidence.anchorAudit.resolved,
      source.id,
    );
    assert.match(
      source.inputEvidence.anchorAudit.anchorSetSha256,
      /^sha256:[a-f0-9]{64}$/,
      source.id,
    );
    const { generationSha256, ...body } = source;
    assert.equal(
      generationSha256,
      sha256(JSON.stringify(stable(body))),
      source.id,
    );
  }
  assert.equal(
    payload.provenance.contentSha256,
    sha256(JSON.stringify(stable(payload.sources))),
  );
});

test("checked-in artifact is byte-for-byte reproducible from the private cache", () => {
  const rebuilt = buildPilotPayload();
  assert.deepEqual(rebuilt, payload);
  assert.equal(renderArtifact(rebuilt), fs.readFileSync(ARTIFACT, "utf8"));
});
