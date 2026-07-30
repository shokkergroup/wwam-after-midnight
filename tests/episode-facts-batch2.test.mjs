import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

import {
  buildBatch2Payload,
  parseCaptionLines,
  renderArtifact,
  resolveAnchor,
} from "../scripts/generate-episode-facts-batch2.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");
const ARTIFACT = path.join(
  ROOT,
  "public",
  "demo",
  "episode-facts-batch2.js",
);
const EXPECTED_IDS = [
  "kX3wb5pBRDo",
  "16h8RkoAuQU",
  "YaE7bkZ2JAM",
  "ZMaNz5FTCwY",
  "3Ndidoo_s58",
  "R_bXrnNOcwg",
  "6VXSBDZ-3WE",
  "YvjsGkVEu0A",
  "1luh7mKQfz8",
  "2m0BgJzEPCk",
  "QwJb31dSo9Y",
  "rtWl8c57SYk",
];
const EXPECTED_COUNTS = {
  kX3wb5pBRDo: 18,
  "16h8RkoAuQU": 11,
  YaE7bkZ2JAM: 12,
  ZMaNz5FTCwY: 6,
  "3Ndidoo_s58": 10,
  R_bXrnNOcwg: 11,
  "6VXSBDZ-3WE": 8,
  YvjsGkVEu0A: 8,
  "1luh7mKQfz8": 12,
  "2m0BgJzEPCk": 15,
  QwJb31dSo9Y: 15,
  rtWl8c57SYk: 11,
};
const PILOT_IDS = new Set([
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
]);
const TOPIC_REBUILD_IDS = new Set([
  "vjyNEQmgxC8",
  "Lllp-P-euww",
  "nv99WEtXGvE",
  "uA5lTCjk7sQ",
  "5T1wWUjCGWk",
  "3Lu5KPrQhc8",
  "rLdk9JKeN68",
  "QxJyVaAgZ_Y",
  "bTzVQKD73L0",
  "KIGg_I72x_M",
]);

function loadArtifact() {
  const context = { window: {} };
  vm.createContext(context);
  vm.runInContext(fs.readFileSync(ARTIFACT, "utf8"), context, {
    filename: ARTIFACT,
  });
  return JSON.parse(
    JSON.stringify(context.window.WWAM_EPISODE_FACTS_BATCH2),
  );
}

function words(value) {
  return String(value || "").match(/[A-Za-z0-9]+(?:['-][A-Za-z0-9]+)*/g) || [];
}

function sha256(value) {
  const input = Buffer.isBuffer(value) ? value : Buffer.from(String(value));
  return `sha256:${crypto.createHash("sha256").update(input).digest("hex")}`;
}

function factList(source) {
  return source[source.formatSpecificFactType];
}

function walkKeys(value, visit) {
  if (Array.isArray(value)) {
    for (const item of value) walkKeys(item, visit);
    return;
  }
  if (!value || typeof value !== "object") return;
  for (const [key, child] of Object.entries(value)) {
    visit(key, child);
    walkKeys(child, visit);
  }
}

const payload = loadArtifact();

test("publishes the exact twelve non-overlapping Batch 2 sources", () => {
  assert.equal(payload.schema, "wwam-episode-facts-batch2/v1");
  assert.deepEqual(
    payload.sources.map((source) => source.id),
    EXPECTED_IDS,
  );
  assert.equal(payload.meta.sources, 12);
  for (const id of EXPECTED_IDS) {
    assert.equal(PILOT_IDS.has(id), false, `${id} overlaps the pilot`);
    assert.equal(
      TOPIC_REBUILD_IDS.has(id),
      false,
      `${id} overlaps a topic rebuild batch`,
    );
  }
});

test("ships 137 typed facts across eight format families", () => {
  assert.equal(payload.meta.facts, 137);
  assert.deepEqual(payload.meta.byType, {
    rankingEvent: 41,
    questionAnswerPair: 6,
    trailerCue: 10,
    scriptSceneCue: 11,
    syncCue: 8,
    agendaItem: 8,
    reviewMoment: 53,
  });
  assert.deepEqual(payload.meta.formats, {
    "episode-recap": 1,
    "news-agenda": 1,
    "question-and-answer": 1,
    "ranking-list": 3,
    "review-desk": 3,
    "script-reading": 1,
    "trailer-breakdown": 1,
    "watchalong-commentary": 1,
  });
});

test("gives every source its fail-closed typed fact floor and omission notes", () => {
  for (const source of payload.sources) {
    assert.equal(factList(source).length, EXPECTED_COUNTS[source.id], source.id);
    assert.ok(source.omissions.length >= 2, source.id);
    assert.equal(source.sourceState.coverage, "typed-caption-batch", source.id);
    assert.equal(source.sourceState.promotionAllowed, false, source.id);
    assert.equal(source.rightsPolicy.fullCaptionPublic, false, source.id);
    assert.equal(source.rightsPolicy.publicExcerptWordLimitPerField, 16, source.id);
  }
});

test("keeps every typed fact playable, bounded, hashed, and excerpt-safe", () => {
  for (const source of payload.sources) {
    const ids = new Set();
    for (const fact of factList(source)) {
      assert.equal(ids.has(fact.id), false, fact.id);
      ids.add(fact.id);
      assert.ok(fact.at >= 0, fact.id);
      assert.ok(fact.end > fact.at, fact.id);
      assert.ok(fact.end <= source.duration + 5, fact.id);
      assert.ok(fact.end - fact.at <= 120, fact.id);
      assert.ok(words(fact.excerpt).length >= 1, fact.id);
      assert.ok(words(fact.excerpt).length <= 16, fact.id);
      if (fact.responseExcerpt !== undefined) {
        assert.ok(words(fact.responseExcerpt).length >= 1, fact.id);
        assert.ok(words(fact.responseExcerpt).length <= 16, fact.id);
        assert.ok(fact.responseAt >= fact.at, fact.id);
        assert.ok(fact.responseEnd <= fact.end, fact.id);
      }
      assert.match(fact.evidenceHash, /^sha256:[a-f0-9]{64}$/, fact.id);
      assert.equal(fact.evidenceType, "youtube-automatic-caption", fact.id);
      assert.equal(fact.confidence, "high", fact.id);
      assert.equal(
        fact.reviewState,
        "machine-surfaced-needs-editor-review",
        fact.id,
      );
      assert.equal(fact.claim.kind, "caption-observation", fact.id);
      assert.equal(fact.claim.scope, "source-local", fact.id);
      assert.equal(fact.claim.rightsSafe, true, fact.id);
      assert.ok(fact.evidence.anchorPhrase, fact.id);
      assert.equal(fact.evidence.fullCaptionPublic, false, fact.id);
      assert.ok(fact.evidence.excerptWordCount <= 16, fact.id);
    }
  }
});

test("leaves identity, frame, provenance, and creator sign-off fields unset", () => {
  const forbidden = /(speaker|visual|origin|creator.?approval)/i;
  for (const source of payload.sources) {
    for (const fact of factList(source)) {
      walkKeys(fact, (key) => {
        assert.equal(forbidden.test(key), false, `${fact.id}:${key}`);
      });
    }
  }
});

test("re-resolves every public anchor against its private caption cache", () => {
  for (const source of payload.sources) {
    const caption = JSON.parse(
      fs.readFileSync(
        path.join(ROOT, "source-cache", "captions", `${source.id}.json`),
        "utf8",
      ),
    );
    const lines = parseCaptionLines(caption);
    for (const fact of factList(source)) {
      const line = resolveAnchor(lines, [
        fact.evidence.anchorAt,
        fact.evidence.anchorPhrase,
        0,
      ]);
      assert.equal(line.at, fact.evidence.anchorAt, fact.id);
      assert.equal(line.end, fact.evidence.anchorEnd, fact.id);
    }
  }
});

test("proves every mandatory anchor resolved and every cached input hash still matches", () => {
  for (const source of payload.sources) {
    assert.ok(source.inputEvidence.anchorAudit.required > factList(source).length);
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
    assert.equal(
      source.inputEvidence.captionSha256,
      sha256(
        fs.readFileSync(
          path.join(ROOT, "source-cache", "captions", `${source.id}.json`),
        ),
      ),
      source.id,
    );
    assert.equal(
      source.inputEvidence.metadataSha256,
      sha256(
        fs.readFileSync(
          path.join(ROOT, "source-cache", "metadata", `${source.id}.json`),
        ),
      ),
      source.id,
    );
  }
});

test("preserves unresolved parallel ballots instead of fabricating owners", () => {
  const kx = payload.sources.find((source) => source.id === "kX3wb5pBRDo");
  const fives = kx.rankingEvents.filter((fact) => fact.position === 5);
  assert.deepEqual(
    fives.map((fact) => fact.subject),
    [
      "Halloween 4: The Return of Michael Myers",
      "Friday the 13th: The Final Chapter",
    ],
  );
  assert.ok(
    fives.every(
      (fact) => fact.sequenceState === "parallel-ballots-unresolved",
    ),
  );
  const h = payload.sources.find((source) => source.id === "16h8RkoAuQU");
  assert.deepEqual(
    h.rankingEvents
      .filter((fact) => fact.position === 5)
      .map((fact) => fact.subject),
    ["Halloween II (1981)", "Rob Zombie's Halloween"],
  );
});

test("keeps Q&A as bounded question-response windows without assigning ownership", () => {
  const source = payload.sources.find((item) => item.id === "ZMaNz5FTCwY");
  assert.equal(source.questionAnswerPairs.length, 6);
  assert.deepEqual(
    source.questionAnswerPairs.map((fact) => fact.subject),
    [
      "Favorite death",
      "Favorite death",
      "Laurie Strode focus",
      "Yearly Halloween movies",
      "Halloween anthology format",
      "Michael Myers escape",
    ],
  );
  for (const fact of source.questionAnswerPairs) {
    assert.ok(Number.isFinite(fact.responseAt), fact.id);
    assert.ok(fact.end >= fact.responseEnd, fact.id);
    assert.equal(fact.eventKind, "captioned-question-response-window", fact.id);
  }
});

test("preserves theories, section scores, and sync corrections as typed evidence", () => {
  const trailer = payload.sources.find((source) => source.id === "3Ndidoo_s58");
  assert.equal(
    trailer.trailerCues.filter(
      (fact) => fact.cueKind === "captioned-trailer-theory",
    ).length,
    3,
  );
  const kills = payload.sources.find((source) => source.id === "QwJb31dSo9Y");
  assert.deepEqual(
    kills.reviewMoments
      .filter((fact) => fact.momentKind === "captioned-section-score")
      .map((fact) => fact.scoreText),
    ["10 out of 10", "6", "8.5"],
  );
  const sync = payload.sources.find((source) => source.id === "6VXSBDZ-3WE");
  assert.deepEqual(
    sync.syncCues.slice(-3).map((fact) => fact.cueKind),
    [
      "captioned-sync-false-start",
      "captioned-sync-correction",
      "captioned-sync-start",
    ],
  );
});

test("does not silently promote corrupted poll wording into a tier", () => {
  const source = payload.sources.find((item) => item.id === "YaE7bkZ2JAM");
  assert.equal(
    source.rankingEvents.some((fact) =>
      /alzheimer/i.test(String(fact.tier || fact.claim.text)),
    ),
    false,
  );
  assert.equal(
    source.rankingEvents.find((fact) => fact.subject === "Funny Games remake")
      .captionedTally,
    "75 to 25",
  );
});

test("browser artifact is byte-for-byte deterministic and current", () => {
  const generated = buildBatch2Payload();
  assert.deepEqual(payload, JSON.parse(JSON.stringify(generated)));
  assert.equal(fs.readFileSync(ARTIFACT, "utf8"), renderArtifact(generated));
  assert.match(
    payload.provenance.contentSha256,
    /^sha256:[a-f0-9]{64}$/,
  );
  assert.throws(
    () => resolveAnchor([], [100, "missing mandatory anchor", 0]),
    /Required caption anchor drifted/,
  );
});
