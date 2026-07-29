import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

import {
  assertEligibleSource,
  buildPilotPayload,
  parseCaptionLines,
  renderArtifact,
} from "../scripts/generate-episode-guide-v2-pilot.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");
const ARTIFACT = path.join(ROOT, "public", "demo", "episode-guide-v2-pilot.js");
const PILOT_IDS = [
  "LV2rmwEA0w4",
  "iz0WFhe6LYM",
  "FVuwRHM0kcc",
  "WKs1uPGMQvw",
];

function loadArtifact() {
  const context = { window: {} };
  vm.createContext(context);
  vm.runInContext(fs.readFileSync(ARTIFACT, "utf8"), context, {
    filename: ARTIFACT,
  });
  return JSON.parse(
    JSON.stringify(context.window.WWAM_EPISODE_GUIDE_V2_PILOT),
  );
}

function cleanWords(value) {
  return String(value || "").match(/[A-Za-z0-9]+(?:['’-][A-Za-z0-9]+)*/g) || [];
}

function objectKeys(value, keys = []) {
  if (!value || typeof value !== "object") return keys;
  if (Array.isArray(value)) {
    value.forEach((item) => objectKeys(item, keys));
    return keys;
  }
  for (const [key, nested] of Object.entries(value)) {
    keys.push(key);
    objectKeys(nested, keys);
  }
  return keys;
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

function evidenceAppears(cut) {
  const pattern = new RegExp(
    cut.topicEvidence
      .toLowerCase()
      .replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
      .replace(/[-\s]+/g, "[-\\s]+"),
  );
  return pattern.test(cut.excerpt.toLowerCase());
}

const payload = loadArtifact();

test("publishes four isolated caption-backed pilots across three source formats", () => {
  assert.equal(payload.schema, "wwam-episode-guide-v2-pilot/v1");
  assert.deepEqual(payload.guides.map((record) => record.id), PILOT_IDS);
  assert.deepEqual(payload.meta, {
    guides: 4,
    chapters: 24,
    threads: 24,
    cuts: 48,
    contentModes: {
      "movie-news": 2,
      "spoiler-review": 1,
      "visual-ranking": 1,
    },
  });
  assert.deepEqual(
    [...new Set(payload.guides.map((record) => record.contentMode))].sort(),
    ["movie-news", "spoiler-review", "visual-ranking"],
  );
  assert.equal(payload.policy.topicNavigationOnlyAllowed, false);
  assert.equal(payload.policy.speakerAttributionAllowed, false);
  assert.equal(payload.policy.visualOutcomeClaimsAllowed, false);
});

test("keeps every guide inside the Episode Guide V2 evidence and size contract", () => {
  const attributionKeys =
    /^(?:speaker|speakerId|speakerName|host|performer|attributedTo|saidBy|quoteBy)$/i;
  for (const record of payload.guides) {
    const guide = record.episodeGuide;
    assert.equal(record.sourceState.coverage, "caption-backed", record.id);
    assert.equal(record.sourceState.evidenceState, "machine-surfaced", record.id);
    assert.equal(record.sourceState.promotionAllowed, false, record.id);
    assert.equal(record.rightsPolicy.restrictedToTopicNavigation, false, record.id);
    assert.equal(guide.schema, "wwam-episode-guide/v2", record.id);
    assert.equal(guide.pilot, true, record.id);
    assert.match(guide.basis, /speaker.*unverified/i, record.id);
    assert.ok(guide.cuts.length >= 8 && guide.cuts.length <= 20, record.id);
    assert.ok(guide.chapters.length >= 4 && guide.chapters.length <= 8, record.id);
    assert.equal(guide.takeArc.length, 3, record.id);
    assert.ok(guide.threads.length >= 3 && guide.threads.length <= 10, record.id);
    assert.deepEqual(guide.shape, {
      runtimeBand: "MARATHON",
      chapters: guide.chapters.length,
      threads: guide.threads.length,
      cuts: guide.cuts.length,
    });
    assert.equal(
      objectKeys(guide).some((key) => attributionKeys.test(key)),
      false,
      record.id,
    );

    const cutIds = new Set(guide.cuts.map((cut) => cut.id));
    assert.equal(cutIds.size, guide.cuts.length, record.id);
    for (const cut of guide.cuts) {
      assert.ok(cut.at >= 0 && cut.end > cut.at, `${record.id}:${cut.id}`);
      assert.ok(cut.end <= record.duration, `${record.id}:${cut.id}`);
      assert.ok(cleanWords(cut.excerpt).length > 0, `${record.id}:${cut.id}`);
      assert.ok(
        cleanWords(cut.excerpt).length <=
          Math.min(25, record.rightsPolicy.publicExcerptWordLimit),
        `${record.id}:${cut.id}`,
      );
      assert.equal(
        cut.topicBasis,
        "canonical-topic-local-caption-match",
        `${record.id}:${cut.id}`,
      );
      assert.equal(cut.topicSupport, 1, `${record.id}:${cut.id}`);
      assert.ok(cut.topicEvidence, `${record.id}:${cut.id}`);
      assert.match(
        cut.evidenceBasis,
        /^(?:public-moment|topic-first|topic-peak)\+local-caption-topic-match$/,
        `${record.id}:${cut.id}`,
      );
      assert.ok(
        ["public-moment", "topic-first", "topic-peak"].includes(cut.anchor.kind),
        `${record.id}:${cut.id}`,
      );
      assert.ok(
        Math.abs(cut.anchor.offsetSeconds) <=
          (cut.anchor.kind === "public-moment" ? 30 : 180),
        `${record.id}:${cut.id} escaped its bounded local anchor window`,
      );
    }
    assert.ok(
      guide.cuts.some((cut) => cut.anchor.kind === "public-moment"),
      `${record.id} needs a registered public-moment anchor`,
    );
    for (const thread of guide.threads) {
      assert.ok(
        guide.cuts.some((cut) =>
          cut.topic === thread.name && evidenceAppears(cut),
        ),
        `${record.id}:${thread.name} needs one displayed subject-bound cut`,
      );
    }
    for (const key of ["loved", "hated"]) {
      const receipt = guide.fanRead[key];
      if (!receipt) continue;
      const cut = guide.cuts.find((candidate) => candidate.id === receipt.cutId);
      assert.ok(cut, `${record.id}:${key}`);
      assert.ok(evidenceAppears(cut), `${record.id}:${key} must name its displayed subject`);
      assert.match(
        cut.excerpt,
        key === "loved"
          ? /\b(?:love|great|best|amazing|favorite|anticipated)\b/i
          : /\b(?:hate|worst|terrible|awful|garbage|trash|sucks|stupid|atrocious)\b/i,
        `${record.id}:${key} needs an evaluative cue`,
      );
    }
    for (const chapter of guide.chapters) {
      assert.ok(cutIds.has(chapter.cutId), `${record.id}:${chapter.cutId}`);
      assert.ok(cleanWords(chapter.excerpt).length <= 25, record.id);
    }
    for (const phase of guide.takeArc) {
      assert.ok(cutIds.has(phase.cutId), `${record.id}:${phase.cutId}`);
      assert.ok(cleanWords(phase.excerpt).length <= 25, record.id);
    }
  }
});

test("changes the guide vocabulary and truth boundary with the show format", () => {
  const byId = new Map(payload.guides.map((record) => [record.id, record]));
  const news = byId.get("LV2rmwEA0w4").episodeGuide;
  const newsControl = byId.get("iz0WFhe6LYM").episodeGuide;
  const ranking = byId.get("FVuwRHM0kcc").episodeGuide;
  const spoiler = byId.get("WKs1uPGMQvw").episodeGuide;

  assert.ok(
    news.cuts.some((cut) => /WIRE|NEWS DESK|TRAILER COURT/.test(cut.category)),
  );
  assert.ok(
    newsControl.cuts.some((cut) => /WIRE|NEWS DESK|TRAILER COURT/.test(cut.category)),
  );
  assert.ok(
    ranking.cuts.some((cut) => /BRACKET|MATCHUP|BAT-FIELD/.test(cut.category)),
  );
  assert.match(ranking.overview, /does not invent an on-screen winner/i);
  assert.match(ranking.evidenceSummary, /visual bracket outcomes remain outside/i);
  assert.doesNotMatch(
    [
      ranking.overview,
      ranking.evidenceSummary,
      ...ranking.chapters.map((chapter) => chapter.body),
    ].join(" "),
    /\b(?:winner was|won the bracket|advanced to the final|eliminated)\b/i,
  );
  assert.ok(
    spoiler.cuts.some((cut) =>
      /SPOILER|GHOSTFACE CASE FILE|THEORY BOARD|CASTING CASE/.test(cut.category),
    ),
  );
  assert.match(spoiler.overview, /spoiler-desk map/i);
  assert.notEqual(news.overview, newsControl.overview);
  assert.notDeepEqual(
    news.cuts.map((cut) => `${cut.topic}:${cut.at}`),
    newsControl.cuts.map((cut) => `${cut.topic}:${cut.at}`),
  );
});

test("records deterministic per-source and payload hashes", () => {
  for (const record of payload.guides) {
    const { generationSha256, ...body } = record;
    const canonical = JSON.stringify(stable(body));
    assert.match(generationSha256, /^sha256:[a-f0-9]{64}$/);
    assert.equal(generationSha256, sha256(canonical), record.id);
    assert.match(record.inputEvidence.captionSha256, /^sha256:[a-f0-9]{64}$/);
    assert.match(
      record.inputEvidence.canonicalArtifactSha256,
      /^sha256:[a-f0-9]{64}$/,
    );
    assert.ok(canonical.length > 1000);
  }
  assert.match(payload.provenance.contentSha256, /^sha256:[a-f0-9]{64}$/);
  assert.equal(
    payload.provenance.contentSha256,
    sha256(JSON.stringify(stable(payload.guides))),
  );
  assert.equal(renderArtifact(payload), fs.readFileSync(ARTIFACT, "utf8"));
  assert.doesNotMatch(
    fs.readFileSync(ARTIFACT, "utf8"),
    /[\u201c\u201d\u00c2\u00e2\u20ac]/,
    "generated public copy must stay free of smart-quote/mojibake glyphs",
  );
});

test("rejects topic-navigation-only and missing-caption sources before generation", () => {
  const fakeCaption = path.join(ROOT, "package.json");
  assert.throws(
    () =>
      assertEligibleSource(
        {
          id: "restricted",
          captioned: true,
          topics: [{ name: "A" }, { name: "B" }, { name: "C" }],
        },
        { restrictedToTopicNavigation: true },
        fakeCaption,
      ),
    /topic-navigation-only/i,
  );
  assert.throws(
    () =>
      assertEligibleSource(
        {
          id: "uncaptioned",
          captioned: false,
          topics: [{ name: "A" }, { name: "B" }, { name: "C" }],
        },
        { restrictedToTopicNavigation: false },
        fakeCaption,
      ),
    /not caption-backed/i,
  );
  assert.throws(
    () =>
      assertEligibleSource(
        {
          id: "missing",
          captioned: true,
          topics: [{ name: "A" }, { name: "B" }, { name: "C" }],
        },
        { restrictedToTopicNavigation: false },
        path.join(ROOT, "source-cache", "captions", "does-not-exist.json"),
      ),
    /no local caption cache/i,
  );
});

test("caption parsing ignores window-control rows and remains deterministic", () => {
  const fixture = {
    events: [
      { tStartMs: 0, dDurationMs: 9000, id: 1 },
      {
        tStartMs: 1000,
        dDurationMs: 2000,
        segs: [{ utf8: "Batman" }, { utf8: " begins." }],
      },
      {
        tStartMs: 1000,
        dDurationMs: 2000,
        segs: [{ utf8: "Batman" }, { utf8: " begins." }],
      },
      { tStartMs: 3000, dDurationMs: 1000, segs: [{ utf8: "\n" }] },
    ],
  };
  assert.deepEqual(parseCaptionLines(fixture), [
    { at: 1, end: 3, text: "Batman begins." },
  ]);
});

test(
  "local source caches reproduce the checked-in pilot byte for byte",
  { skip: !PILOT_IDS.every((id) =>
    fs.existsSync(path.join(ROOT, "source-cache", "captions", `${id}.json`)),
  ) },
  () => {
    const rebuilt = buildPilotPayload({ rootDir: ROOT });
    assert.equal(renderArtifact(rebuilt), fs.readFileSync(ARTIFACT, "utf8"));
  },
);
