import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

import {
  buildBatch3Payload,
  parseCaptionLines,
  renderArtifact,
  resolveAnchor,
} from "../scripts/generate-episode-facts-batch3.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");
const DEMO = path.join(ROOT, "public", "demo");
const ARTIFACT = path.join(DEMO, "episode-facts-batch3.js");
const EXPECTED_IDS = [
  "LiTEaN8mpl8",
  "bBp6tSU8kAM",
  "nAjkqsn_JsQ",
  "Var4sSlt-dk",
  "WKs1uPGMQvw",
  "bK5e-m1HUjs",
  "kl8j1AichcI",
  "qRcoPW7FLaQ",
  "AGL5yUH5Xy4",
  "e7Guc5jtHQg",
];
const EXPECTED_COUNTS = {
  LiTEaN8mpl8: 13,
  bBp6tSU8kAM: 16,
  nAjkqsn_JsQ: 15,
  "Var4sSlt-dk": 14,
  WKs1uPGMQvw: 18,
  "bK5e-m1HUjs": 21,
  kl8j1AichcI: 21,
  qRcoPW7FLaQ: 14,
  AGL5yUH5Xy4: 17,
  e7Guc5jtHQg: 15,
};

function loadWindowArtifact(file, globalName) {
  const context = { window: {} };
  vm.createContext(context);
  vm.runInContext(fs.readFileSync(path.join(DEMO, file), "utf8"), context, {
    filename: file,
  });
  return JSON.parse(JSON.stringify(context.window[globalName]));
}

function loadArtifact() {
  return loadWindowArtifact(
    "episode-facts-batch3.js",
    "WWAM_EPISODE_FACTS_BATCH3",
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

function priorFactIds() {
  const pilot = loadWindowArtifact(
    "episode-facts-pilot.js",
    "WWAM_EPISODE_FACTS_PILOT",
  );
  const batch2 = loadWindowArtifact(
    "episode-facts-batch2.js",
    "WWAM_EPISODE_FACTS_BATCH2",
  );
  return new Set(
    [...pilot.sources, ...batch2.sources].map((source) => source.id),
  );
}

function rebuildIds() {
  const ids = new Set();
  const files = fs
    .readdirSync(DEMO)
    .filter((file) => /^episode-guide-v2-topic-rebuild-batch\d+\.js$/.test(file))
    .sort();
  for (const file of files) {
    const source = fs.readFileSync(path.join(DEMO, file), "utf8");
    const context = { window: {} };
    vm.createContext(context);
    vm.runInContext(source, context, { filename: file });
    for (const payload of Object.values(context.window)) {
      for (const guide of payload?.guides || []) ids.add(guide.id);
    }
  }
  return ids;
}

const payload = loadArtifact();

test("publishes the exact ten eligible Batch 3 sources", () => {
  assert.equal(payload.schema, "wwam-episode-facts-batch3/v1");
  assert.deepEqual(
    payload.sources.map((source) => source.id),
    EXPECTED_IDS,
  );
  assert.equal(payload.meta.sources, 10);
});

test("documents the pilot collision and next-weakest substitution", () => {
  assert.deepEqual(payload.selection.collision, {
    id: "fUCQoxTwKqo",
    title: "HALLOWEEN Q + A LIVESTREAM!",
    carryThroughPercent: 21,
    resolution:
      "Excluded because it already has a typed pilot pack; duplicate evidence packs are forbidden.",
  });
  assert.deepEqual(payload.selection.replacement, {
    id: "e7Guc5jtHQg",
    title: "We Watched A Movie LIVE 4/9",
    carryThroughPercent: 25,
    reason: "Next weakest eligible non-overlapping source in the same audit.",
  });
  const replacement = payload.sources.find(
    (source) => source.id === "e7Guc5jtHQg",
  );
  assert.equal(replacement.auditSelection.replacementFor, "fUCQoxTwKqo");
  assert.equal(
    replacement.auditSelection.registeredOverviewCarryThroughPercent,
    25,
  );
});

test("does not overlap prior typed packs or any checked-in topic rebuild batch", () => {
  const typed = priorFactIds();
  const rebuilt = rebuildIds();
  for (const id of EXPECTED_IDS) {
    assert.equal(typed.has(id), false, `${id} overlaps a prior fact pack`);
    assert.equal(rebuilt.has(id), false, `${id} overlaps a topic rebuild pack`);
  }
});

test("ships 164 facts across four format-specific evidence families", () => {
  assert.equal(payload.meta.facts, 164);
  assert.deepEqual(payload.meta.byType, {
    syncCue: 13,
    rankingEvent: 72,
    agendaItem: 61,
    reviewMoment: 18,
  });
  assert.deepEqual(payload.meta.formats, {
    "news-agenda": 4,
    "ranking-list": 4,
    "review-desk": 1,
    "watchalong-commentary": 1,
  });
});

test("gives every source its configured fact floor and truthful omissions", () => {
  for (const source of payload.sources) {
    assert.equal(factList(source).length, EXPECTED_COUNTS[source.id], source.id);
    assert.ok(source.omissions.length >= 2, source.id);
    assert.equal(source.sourceState.coverage, "typed-caption-batch", source.id);
    assert.equal(source.sourceState.promotionAllowed, false, source.id);
    assert.equal(source.rightsPolicy.fullCaptionPublic, false, source.id);
    assert.equal(source.rightsPolicy.publicExcerptWordLimitPerField, 16, source.id);
    assert.ok(
      source.omissions.every((item) => !/\bverified\b.*\bvisual\b/i.test(item)),
      source.id,
    );
  }
  const generic1990 = payload.sources.find(
    (source) => source.id === "bK5e-m1HUjs",
  );
  assert.equal(generic1990.format, "ranking-list");
  assert.match(generic1990.omissions[0], /tape.*controls the format/i);
});

test("keeps every typed fact playable, bounded, hashed, and excerpt-safe", () => {
  for (const source of payload.sources) {
    const ids = new Set();
    const starts = factList(source).map((fact) => fact.at);
    assert.deepEqual(starts, [...starts].sort((a, b) => a - b), source.id);
    for (const fact of factList(source)) {
      assert.equal(ids.has(fact.id), false, fact.id);
      ids.add(fact.id);
      assert.ok(fact.at >= 0, fact.id);
      assert.ok(fact.end > fact.at, fact.id);
      assert.ok(fact.end <= source.duration + 5, fact.id);
      assert.ok(fact.end - fact.at <= 120, fact.id);
      assert.ok(words(fact.excerpt).length >= 1, fact.id);
      assert.ok(words(fact.excerpt).length <= 16, fact.id);
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

test("leaves speaker, visual, origin, and creator-approval fields unset", () => {
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

test("proves every mandatory anchor resolved and every input hash still matches", () => {
  for (const source of payload.sources) {
    assert.ok(source.inputEvidence.anchorAudit.required >= factList(source).length);
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

test("preserves exact Jason X sync and commentary checkpoints", () => {
  const source = payload.sources.find((item) => item.id === "LiTEaN8mpl8");
  assert.deepEqual(
    source.syncCues.map((fact) => fact.subject),
    [
      "Viewer sync setup",
      "Jason X playback start",
      "Jason in outer space",
      "Upcoming Jason X kill",
      "Jason X versus Jason Goes to Hell",
      "Virtual-reality sequence",
      "Commentary resynchronization",
      "Jason X jump scare",
      "KM action sequence",
      "Uber Jason transformation",
      "Uber Jason design",
      "Sleeping-bag sequence",
      "Jason X commentary close",
    ],
  );
  assert.equal(source.syncCues[1].cueKind, "captioned-play-cue");
  assert.equal(source.syncCues[6].cueKind, "captioned-resync-cue");
});

test("preserves ranking ambiguity, shared picks, and on-tape corrections", () => {
  const nineties = payload.sources.find(
    (source) => source.id === "bK5e-m1HUjs",
  );
  const tango = nineties.rankingEvents.find(
    (fact) => fact.subject === "Tango & Cash",
  );
  const replacement = nineties.rankingEvents.find(
    (fact) => fact.subject === "Night of the Living Dead (1990)",
  );
  assert.equal(tango.sequenceState, "removed-on-tape");
  assert.equal(tango.eventKind, "captioned-ranking-correction");
  assert.equal(replacement.position, 2);
  assert.equal(replacement.sequenceState, "replacement-on-tape");

  const decade = payload.sources.find(
    (source) => source.id === "kl8j1AichcI",
  );
  const shared = decade.rankingEvents.filter(
    (fact) => fact.sequenceState === "parallel-ballots-same-placement",
  );
  assert.deepEqual(
    shared.map((fact) => [fact.subject, fact.position]),
    [
      ["Train to Busan", 5],
      ["Sinister", 2],
    ],
  );
});

test("keeps the Marvel/DC final readout ordered and source-local", () => {
  const source = payload.sources.find(
    (item) => item.id === "qRcoPW7FLaQ",
  );
  assert.deepEqual(
    source.rankingEvents
      .filter((fact) => Number.isFinite(fact.position))
      .slice(0, 12)
      .map((fact) => [fact.position, fact.subject]),
    [
      [1, "Logan"],
      [2, "Avengers: Endgame"],
      [3, "The Dark Knight"],
      [4, "The Avengers"],
      [5, "Deadpool"],
      [6, "Batman (1989)"],
      [7, "Man of Steel"],
      [8, "Zack Snyder's Justice League"],
      [9, "Iron Man"],
      [10, "Joker"],
      [11, "Spider-Man 2"],
      [12, "X-Men: Days of Future Past"],
    ],
  );
  assert.equal(source.rankingEvents.at(-1).position, 50);
  assert.equal(
    source.rankingEvents.at(-1).subject,
    "Captain America: The First Avenger",
  );
});

test("keeps Scream 7 praise, criticism, and unresolved ranking distinct", () => {
  const source = payload.sources.find(
    (item) => item.id === "WKs1uPGMQvw",
  );
  assert.ok(
    source.reviewMoments.some(
      (fact) => fact.subject === "Scream 7 franchise ranking" &&
        fact.stance === "unresolved",
    ),
  );
  assert.ok(
    source.reviewMoments.some(
      (fact) => fact.subject === "Scream 7 killer reveal" &&
        fact.stance === "negative-mixed",
    ),
  );
  assert.ok(
    source.reviewMoments.some(
      (fact) => fact.subject === "Overall Scream 7 verdict" &&
        fact.stance === "positive-mixed",
    ),
  );
});

test("gives each mixed livestream a concrete chronological agenda", () => {
  const expectedSubjects = {
    nAjkqsn_JsQ: [
      "Rumored Spider-Man 4 title",
      "Scream 7 legacy-cast direction",
      "Audience poll on Stu",
      "Alfred Hitchcock's horror influence",
    ],
    "Var4sSlt-dk": [
      "X-Men '97",
      "Roger Corman's Fantastic Four",
      "The Terminator as horror",
      "The Black Phone",
    ],
    AGL5yUH5Xy4: [
      "Doom: The Dark Ages",
      "Halloween anthology model",
      "Physical-media format ranking",
      "Horror midnight screenings",
    ],
    e7Guc5jtHQg: [
      "Responding to online criticism",
      "All American Massacre and Chop Top",
      "Rising video-game prices",
      "Bloodsport remake",
    ],
  };
  for (const [id, subjects] of Object.entries(expectedSubjects)) {
    const source = payload.sources.find((item) => item.id === id);
    const actual = new Set(source.agendaItems.map((fact) => fact.subject));
    for (const subject of subjects) {
      assert.equal(actual.has(subject), true, `${id}:${subject}`);
    }
    const starts = source.agendaItems.map((fact) => fact.at);
    assert.deepEqual(starts, [...starts].sort((a, b) => a - b), id);
  }
});

test("rebuilds deterministically and renders the exact browser payload", () => {
  const rebuilt = buildBatch3Payload();
  assert.deepEqual(rebuilt, payload);
  assert.equal(renderArtifact(rebuilt), fs.readFileSync(ARTIFACT, "utf8"));
  assert.match(payload.provenance.contentSha256, /^sha256:[a-f0-9]{64}$/);
  for (const source of payload.sources) {
    assert.match(source.generationSha256, /^sha256:[a-f0-9]{64}$/);
  }
});
