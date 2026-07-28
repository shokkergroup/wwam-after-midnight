import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(here, "..");
const demo = path.join(root, "public", "demo");

function plain(value) {
  return JSON.parse(JSON.stringify(value));
}

function fixture() {
  const context = { window: {} };
  vm.createContext(context);
  for (const file of ["catalog.js", "deep-distill.js", "episode-guides.js"]) {
    vm.runInContext(fs.readFileSync(path.join(demo, file), "utf8"), context, {
      filename: file,
    });
  }
  const catalog = plain(context.window.WWAM_CATALOG);
  const distill = plain(context.window.WWAM_DEEP_DISTILL);
  const guidePayload = plain(context.window.WWAM_EPISODE_GUIDES);
  const guideById = new Map(
    guidePayload.guides.map((record) => [record.id, record.episodeGuide]),
  );
  distill.tapes = distill.tapes.map((tape) => ({
    ...tape,
    episodeGuide: guideById.get(tape.id) || null,
  }));
  return {
    catalog,
    catalogById: new Map(catalog.map((source) => [source.id, source])),
    distill,
  };
}

function wordCount(value) {
  return String(value || "").trim().split(/\s+/).filter(Boolean).length;
}

function publicExcerpts(guide) {
  return [
    ...guide.chapters.map((chapter) => chapter.excerpt),
    ...guide.takeArc.map((phase) => phase.excerpt),
    ...guide.threads.map((thread) => thread.receipt),
    ...guide.cuts.map((cut) => cut.excerpt),
    ...["loved", "hated", "wildestDetour", "lastWord"]
      .map((key) => guide.fanRead?.[key]?.excerpt)
      .filter(Boolean),
  ];
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

function expectedHot100(tapes) {
  const pool = tapes.flatMap((tape) => (
    tape.moments.map((moment) => ({ ...moment, tapeId: tape.id }))
  ));
  pool.sort((left, right) => (
    right.score - left.score
    || (left.tapeId < right.tapeId ? -1 : left.tapeId > right.tapeId ? 1 : 0)
    || left.t - right.t
  ));

  const perTape = new Map();
  const perCategory = new Map();
  const hot = [];
  for (const moment of pool) {
    const tapeCount = perTape.get(moment.tapeId) || 0;
    const categoryCount = perCategory.get(moment.category) || 0;
    if (tapeCount >= 4 || categoryCount >= 24) continue;
    perTape.set(moment.tapeId, tapeCount + 1);
    perCategory.set(moment.category, categoryCount + 1);
    hot.push({ ...moment, rank: hot.length + 1 });
    if (hot.length === 100) break;
  }
  return hot;
}

test("publishes one complete, runtime-sized Episode Guide V2 for every captioned commentary", () => {
  const { catalog, catalogById, distill } = fixture();
  const captioned = catalog.filter((source) => source.transcript);
  const guidedTapes = distill.tapes.filter((tape) => tape.episodeGuide);

  assert.equal(catalog.length, 39);
  assert.equal(captioned.length, 38);
  assert.equal(guidedTapes.length, 38);
  assert.deepEqual(
    guidedTapes.map((tape) => tape.id).sort(),
    captioned.map((source) => source.id).sort(),
  );
  const actualChapters = guidedTapes.reduce(
    (total, tape) => total + tape.episodeGuide.chapters.length,
    0,
  );
  const actualCuts = guidedTapes.reduce(
    (total, tape) => total + tape.episodeGuide.cuts.length,
    0,
  );
  assert.deepEqual(
    {
      episodeGuides: distill.meta.episodeGuides,
      guideChapters: distill.meta.guideChapters,
      guideCuts: distill.meta.guideCuts,
    },
    {
      episodeGuides: guidedTapes.length,
      guideChapters: actualChapters,
      guideCuts: actualCuts,
    },
  );

  for (const tape of guidedTapes) {
    const guide = tape.episodeGuide;
    const source = catalogById.get(tape.id);
    const expected = source.duration < 5700
      ? { runtimeBand: "FEATURE", chapters: 5, threads: 6, cuts: 13 }
      : source.duration < 6600
        ? { runtimeBand: "EXTENDED", chapters: 6, threads: 7, cuts: 15 }
        : { runtimeBand: "MARATHON", chapters: 7, threads: 8, cuts: 17 };
    assert.equal(guide.schema, "wwam-episode-guide/v2", tape.id);
    assert.deepEqual(guide.shape, expected, tape.id);
    assert.equal(guide.chapters.length, expected.chapters, tape.id);
    assert.deepEqual(
      guide.chapters.map((chapter) => chapter.at),
      [...guide.chapters].sort((a, b) => a.at - b.at).map((chapter) => chapter.at),
      `${tape.id} chapters must remain chronological`,
    );
    assert.equal(guide.takeArc.length, 3, tape.id);
    const closingCut = guide.cuts.find(
      (cut) => cut.id === guide.takeArc.at(-1).cutId,
    );
    const localClosingCandidates = guide.cuts.filter(
      (cut) => cut.t >= source.duration * 0.82
        && cut.topicBasis === "local-caption-match",
    );
    if (localClosingCandidates.length) {
      assert.equal(
        closingCut.topicBasis,
        "local-caption-match",
        tape.id + " closing read must prefer locally named evidence",
      );
    }
    assert.equal(guide.threads.length, expected.threads, tape.id);
    assert.equal(guide.cuts.length, expected.cuts, tape.id);
    assert.deepEqual(guide.metrics, {
      chapters: expected.chapters,
      threads: expected.threads,
      cuts: expected.cuts,
      praise: guide.cuts.filter((cut) => cut.category === "LOVE LETTER").length,
      negative: guide.cuts.filter(
        (cut) => cut.category === "FRANCHISE FELONY",
      ).length,
      comedy: guide.cuts.filter((cut) => (
        cut.category === "BREAKDOWN"
        || cut.category === "OUT OF POCKET"
        || cut.category === "BIT ENERGY"
      )).length,
      substantive: guide.cuts.filter((cut) => cut.substance >= 8).length,
    }, tape.id);
  }
});
test("keeps every guide receipt short, source-bounded, uniquely addressable, and runtime-spanning", () => {
  const { catalogById, distill } = fixture();
  const guidedTapes = distill.tapes.filter((tape) => tape.episodeGuide);
  const scopedCutIds = new Set();

  for (const tape of guidedTapes) {
    const source = catalogById.get(tape.id);
    const guide = tape.episodeGuide;
    const cutIds = guide.cuts.map((cut) => cut.id);
    const cutTimes = guide.cuts.map((cut) => cut.t);
    assert.equal(new Set(cutIds).size, cutIds.length, tape.id);
    assert.equal(new Set(cutTimes).size, cutTimes.length, tape.id);

    for (const cut of guide.cuts) {
      assert.ok(Number.isInteger(cut.t) && cut.t >= 0, `${tape.id}:${cut.id}`);
      assert.ok(Number.isInteger(cut.end) && cut.end > cut.t, `${tape.id}:${cut.id}`);
      assert.ok(cut.t < source.duration, `${tape.id}:${cut.id}`);
      // Auto-caption and YouTube metadata runtimes can differ by a few seconds.
      assert.ok(cut.end <= source.duration + 60, `${tape.id}:${cut.id}`);
      assert.ok(cut.end - cut.t <= 45, `${tape.id}:${cut.id}`);
      scopedCutIds.add(`${tape.id}:${cut.id}`);
    }
    assert.ok(Math.min(...cutTimes) <= source.duration * 0.2, tape.id);
    assert.ok(Math.max(...cutTimes) >= source.duration * 0.8, tape.id);

    const cutIdSet = new Set(cutIds);
    for (const chapter of guide.chapters) {
      assert.ok(cutIdSet.has(chapter.cutId), `${tape.id}:${chapter.cutId}`);
      assert.ok(chapter.at >= 0 && chapter.at < source.duration, tape.id);
      assert.ok(chapter.end > chapter.at && chapter.end <= source.duration + 60, tape.id);
    }
    for (const excerpt of publicExcerpts(guide)) {
      assert.ok(wordCount(excerpt) > 0, tape.id);
      assert.ok(wordCount(excerpt) <= 25, `${tape.id}: ${wordCount(excerpt)} words`);
    }
  }

  assert.equal(scopedCutIds.size, distill.meta.guideCuts);
});

test("makes each overview episode-specific and each cut set meaningfully varied", () => {
  const { catalogById, distill } = fixture();
  const guidedTapes = distill.tapes.filter((tape) => tape.episodeGuide);
  const overviews = guidedTapes.map((tape) => tape.episodeGuide.overview);
  assert.equal(new Set(overviews).size, guidedTapes.length);

  for (const tape of guidedTapes) {
    const source = catalogById.get(tape.id);
    const guide = tape.episodeGuide;
    assert.match(
      guide.overview.toLowerCase(),
      new RegExp(source.film.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").toLowerCase()),
      tape.id,
    );
    assert.ok(wordCount(guide.overview) >= 45, tape.id);
    assert.ok(
      guide.threads.slice(0, 4).every((thread) => guide.overview.includes(thread.name)),
      tape.id,
    );
    assert.equal(new Set(guide.threads.map((thread) => thread.name)).size, guide.threads.length, tape.id);
    assert.ok(new Set(guide.cuts.map((cut) => cut.category)).size >= 5, tape.id);
  }
});

test("binds topics locally and keeps every closing read in the final thirty percent", () => {
  const { catalogById, distill } = fixture();
  const guidedTapes = distill.tapes.filter((tape) => tape.episodeGuide);
  let localTopicCuts = 0;
  let totalCuts = 0;

  for (const tape of guidedTapes) {
    const source = catalogById.get(tape.id);
    const guide = tape.episodeGuide;
    const chapterCutIds = new Set(guide.chapters.map((chapter) => chapter.cutId));
    const arcCutIds = guide.takeArc.map((take) => take.cutId);

    assert.equal(new Set(arcCutIds).size, 3, tape.id);
    const overlapCount = arcCutIds.filter((cutId) => chapterCutIds.has(cutId)).length;
    assert.ok(overlapCount <= 2, tape.id);
    assert.equal(guide.takeArc.at(-1).phase, "CLOSING READ", tape.id);
    assert.equal(
      guide.takeArc.at(-1).evidenceBasis,
      "late-evaluative-fallback",
      tape.id,
    );
    assert.doesNotMatch(
      guide.takeArc.at(-1).body,
      /actual final ruling|hand down a verdict|closing verdict/i,
      tape.id,
    );
    assert.ok(guide.takeArc.at(-1).at >= source.duration * 0.70, tape.id);

    for (const cut of guide.cuts) {
      totalCuts += 1;
      assert.ok(
        cut.topicBasis === "local-caption-match"
          || cut.topicBasis === "film-context-fallback",
        tape.id,
      );
      assert.ok(cut.categorySupport >= 1, `${tape.id}:${cut.id}`);
      assert.ok(cut.categoryEvidence, `${tape.id}:${cut.id}`);
      assert.ok(cut.evidenceBasis, `${tape.id}:${cut.id}`);
      if (cut.topicBasis === "local-caption-match") {
        localTopicCuts += 1;
        assert.ok(cut.topicSupport >= 1, `${tape.id}:${cut.id}`);
        assert.ok(cut.topicEvidence, `${tape.id}:${cut.id}`);
      } else {
        assert.equal(cut.topic, source.film, `${tape.id}:${cut.id}`);
        assert.equal(cut.topicSupport, 0, `${tape.id}:${cut.id}`);
      }
    }
  }

  assert.ok(localTopicCuts / totalCuts >= 0.75);
});
test("publishes fan-first episode synthesis without exposing machine-room prose", () => {
  const { distill } = fixture();
  const guidedTapes = distill.tapes.filter((tape) => tape.episodeGuide);
  const bannedVisibleLanguage = /caption match|analysis-weighted|bounded closing|saved reaction ledger|explicit evaluative|playable index|evidence threshold|displayed receipt|subject alias|category cue|narrower subject|promoted to a final verdict/i;

  for (const tape of guidedTapes) {
    const guide = tape.episodeGuide;
    const visibleNarrative = [
      guide.overview,
      ...guide.chapters.map((chapter) => chapter.body),
      ...guide.takeArc.map((take) => take.body),
      guide.fanRead.whyThisNightMatters.body,
      ...["loved", "hated", "wildestDetour", "lastWord"]
        .map((key) => guide.fanRead[key]?.body)
        .filter(Boolean),
    ].join(" ");
    assert.ok(wordCount(guide.overview) >= 35, tape.id);
    assert.doesNotMatch(visibleNarrative, bannedVisibleLanguage, tape.id);
    assert.match(guide.evidenceSummary, /caption matches/i, tape.id);
    assert.equal(guide.fanRead.whyThisNightMatters.label, "WHY THIS NIGHT MATTERS", tape.id);
    assert.ok(wordCount(guide.fanRead.whyThisNightMatters.body) >= 20, tape.id);
    assert.equal(guide.fanRead.hated?.label, "STRAIGHT TO STEVE'S ASSHOLE", tape.id);
    for (const key of ["loved", "hated", "wildestDetour", "lastWord"]) {
      const receipt = guide.fanRead[key];
      if (!receipt) continue;
      assert.ok(guide.cuts.some((cut) => cut.id === receipt.cutId), `${tape.id}:${key}`);
      assert.ok(receipt.end > receipt.at, `${tape.id}:${key}`);
      assert.ok(receipt.excerpt, `${tape.id}:${key}`);
    }
  }
});
test("preserves an explicit no-speaker-attribution boundary", () => {
  const { distill } = fixture();
  const guidedTapes = distill.tapes.filter((tape) => tape.episodeGuide);
  const attributionKeys = /^(?:speaker|speakerId|speakerName|host|performer|attributedTo|saidBy|quoteBy)$/i;

  for (const tape of guidedTapes) {
    const guide = tape.episodeGuide;
    assert.match(guide.basis, /speaker identity .* unverified/i, tape.id);
    assert.equal(
      objectKeys(guide).some((key) => attributionKeys.test(key)),
      false,
      tape.id,
    );
  }
});

test("known cross-film outro references never become another movie's closing read", () => {
  const { distill } = fixture();
  const byId = new Map(distill.tapes.map((tape) => [tape.id, tape]));
  const freddyClose = byId.get("HNN0SEy2qtY").episodeGuide.takeArc.at(-1);
  const jasonClose = byId.get("EIw3TG3XwxA").episodeGuide.takeArc.at(-1);
  assert.doesNotMatch(freddyClose.excerpt, /(?:friday )?the 13th/i);
  assert.doesNotMatch(jasonClose.excerpt, /jason x/i);
});

test("keeps Episode Guide V2 additive to the legacy eight-moment and Hot 100 contracts", () => {
  const { distill } = fixture();
  const captioned = distill.tapes.filter((tape) => tape.wordsAudited > 0);
  const sealed = distill.tapes.filter((tape) => tape.wordsAudited === 0);

  assert.equal(captioned.length, 38);
  assert.ok(captioned.every((tape) => tape.moments.length === 8));
  assert.equal(sealed.length, 1);
  assert.equal(sealed[0].id, "AzrcgoyE7C4");
  assert.deepEqual(sealed[0].moments, []);
  assert.equal(sealed[0].episodeGuide, null);

  assert.equal(distill.meta.hotMoments, 100);
  assert.equal(distill.hot100.length, 100);
  assert.deepEqual(distill.hot100, expectedHot100(distill.tapes));
  assert.deepEqual(
    distill.hot100.map((moment) => moment.rank),
    Array.from({ length: 100 }, (_, index) => index + 1),
  );
});
