import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import vm from "node:vm";
import { fileURLToPath } from "node:url";
import {
  buildReviewBatch,
  classifyGuideFormat,
  parseCaptionLines,
  renderReviewBatchArtifacts,
} from "../scripts/generate-episode-guide-v2-review-batch.mjs";

const TEST_DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(TEST_DIR, "..");
const INDEX_PATH =
  "public/demo/episode-guide-v2-review-batch-index.js";
const SHARD_PATHS = [
  "public/demo/episode-guide-v2-review-batch-movie-news.js",
  "public/demo/episode-guide-v2-review-batch-ranking.js",
  "public/demo/episode-guide-v2-review-batch-review-reaction.js",
  "public/demo/episode-guide-v2-review-batch-livestream.js",
];

const batch = buildReviewBatch({ rootDir: ROOT });
const guides = batch.shards.flatMap((shard) => shard.guides);

function loadGlobal(relativePath, globalName) {
  const context = { window: {} };
  vm.createContext(context);
  vm.runInContext(
    fs.readFileSync(path.join(ROOT, relativePath), "utf8"),
    context,
    { filename: relativePath },
  );
  return JSON.parse(JSON.stringify(context.window[globalName]));
}

function tokens(value) {
  return (
    String(value ?? "").match(/[A-Za-z0-9]+(?:['-][A-Za-z0-9]+)*/g) || []
  );
}

function normalized(value) {
  return tokens(value).join(" ").toLowerCase();
}

function topicEvidenceAppears(excerpt, evidence) {
  const comparable = (token) =>
    String(token).toLowerCase().replace(/'s$/i, "");
  const excerptTokens = tokens(excerpt).map(comparable);
  const evidenceTokens = tokens(evidence).map(comparable);
  const needle = evidenceTokens.join(" ");
  for (
    let index = 0;
    index <= excerptTokens.length - evidenceTokens.length;
    index += 1
  ) {
    if (
      excerptTokens.slice(index, index + evidenceTokens.length).join(" ") ===
      needle
    ) {
      return true;
    }
  }
  return false;
}

function generatedProse(guide) {
  const episode = guide.episodeGuide;
  let prose = [
    episode.overview,
    episode.evidenceSummary,
    episode.recap.headline,
    episode.recap.dek,
    ...episode.recap.paragraphs.map((paragraph) => paragraph.body),
    ...episode.chapters.map((chapter) => chapter.body),
    ...Object.values(episode.lanes)
      .filter(Boolean)
      .map((lane) => lane.body),
  ].join("\n");
  for (const excerpt of episode.cuts
    .map((cut) => cut.excerpt)
    .sort((left, right) => right.length - left.length)) {
    prose = prose.split(excerpt).join("<SOURCE TAPE>");
  }
  return prose;
}

test("classifies the reusable four-format spine without relaxing held trailer policy", () => {
  assert.equal(classifyGuideFormat("movie-news"), "movie-news");
  assert.equal(classifyGuideFormat("visual-ranking"), "ranking");
  assert.equal(classifyGuideFormat("visual-ranking-guest"), "ranking");
  assert.equal(classifyGuideFormat("spoiler-review"), "review-reaction");
  assert.equal(classifyGuideFormat("event-reaction"), "review-reaction");
  assert.equal(classifyGuideFormat("trailer-reaction"), "review-reaction");
  assert.equal(classifyGuideFormat("franchise-discussion"), "livestream");
  assert.equal(classifyGuideFormat("q-and-a"), "livestream");
  assert.equal(classifyGuideFormat("after-party-discussion"), "livestream");
  assert.equal(classifyGuideFormat("movie-commentary"), "");
});

test("builds a materially larger, representative, review-quarantined batch", () => {
  assert.equal(batch.index.schema, "wwam-episode-guide-v2-review-batch-index/v1");
  assert.equal(batch.index.selection.scannedSources, 40);
  assert.equal(batch.index.selection.eligibleGuides, 28);
  assert.equal(batch.index.selection.excludedSources, 12);
  assert.equal(batch.index.selection.guidesWithFullRecapDraft, 28);
  assert.equal(batch.index.selection.totalCuts, 336);
  assert.deepEqual(batch.index.selection.guideFormats, {
    "movie-news": 7,
    ranking: 12,
    "review-reaction": 3,
    livestream: 6,
  });
  assert.deepEqual(batch.index.selection.sourceContentModes, {
    "after-party-discussion": 1,
    "event-reaction": 1,
    "franchise-discussion": 3,
    "movie-news": 7,
    "q-and-a": 2,
    "spoiler-review": 2,
    "visual-ranking": 11,
    "visual-ranking-guest": 1,
  });
  assert.equal(batch.index.policy.promotionAllowed, false);
  assert.equal(batch.index.policy.commentaryAllowed, false);
  assert.equal(batch.index.policy.topicNavigationOnlyAllowed, false);
  assert.equal(batch.index.policy.publicExcerptWordLimit, 16);
  assert.equal(batch.index.policy.maxAnchorDistanceSeconds, 30);
  assert.equal(batch.index.policy.reviewState, "review-quarantined-unreviewed");

  assert.equal(new Set(guides.map((guide) => guide.id)).size, 28);
  assert.ok(
    batch.index.exclusionReport.every((record) =>
      record.reasons.includes("topic-navigation-only"),
    ),
  );
  const excludedIds = new Set(
    batch.index.exclusionReport.map((record) => record.id),
  );
  assert.ok(guides.every((guide) => !excludedIds.has(guide.id)));
  assert.ok(
    batch.index.exclusionReport.some(
      (record) =>
        record.contentMode === "trailer-reaction" &&
        record.reasons.includes("topic-navigation-only"),
    ),
  );
});

test("every guide carries a deep recap, playable structure, and hard review hold", () => {
  for (const record of guides) {
    const episode = record.episodeGuide;
    assert.equal(record.sourceState.coverage, "caption-backed", record.id);
    assert.equal(record.sourceState.evidenceState, "machine-surfaced", record.id);
    assert.equal(
      record.sourceState.reviewState,
      "review-quarantined-unreviewed",
      record.id,
    );
    assert.equal(
      record.sourceState.publicationStatus,
      "held-for-human-review",
      record.id,
    );
    assert.equal(record.sourceState.promotionAllowed, false, record.id);
    assert.equal(record.rightsPolicy.restrictedToTopicNavigation, false, record.id);
    assert.equal(record.rightsPolicy.speakerClaimsAllowed, false, record.id);
    assert.equal(record.rightsPolicy.performerClaimsAllowed, false, record.id);
    assert.equal(record.rightsPolicy.originClaimsAllowed, false, record.id);
    assert.equal(record.rightsPolicy.visualClaimsAllowed, false, record.id);
    assert.equal(record.rightsPolicy.promotionAllowed, false, record.id);

    assert.equal(episode.schema, "wwam-episode-guide/v2", record.id);
    assert.equal(episode.variant, "review-batch", record.id);
    assert.equal(episode.publicationStatus, "review-quarantined", record.id);
    assert.equal(episode.promotionAllowed, false, record.id);
    assert.equal(episode.recap.status, "machine-draft-review-required", record.id);
    assert.match(episode.recap.label, /FELDMAN APPROVED RECAP/i, record.id);
    assert.equal(episode.recap.paragraphs.length, 4, record.id);
    assert.equal(episode.recap.sourceCutIds.length, 12, record.id);
    assert.equal(episode.recap.promotionAllowed, false, record.id);
    assert.equal(episode.chapters.length, 6, record.id);
    assert.deepEqual(
      episode.takeArc.map((take) => take.phase),
      ["OPENING READ", "MIDPOINT TURN", "CLOSING READ"],
      record.id,
    );
    assert.ok(
      episode.takeArc.every(
        (take) =>
          episode.cuts.some((cut) => cut.id === take.cutId) &&
          take.promotionAllowed === false,
      ),
      record.id,
    );
    assert.equal(episode.threads.length, 6, record.id);
    assert.equal(episode.cuts.length, 12, record.id);
    assert.ok(episode.metrics.uniqueTopics >= 8, record.id);
    assert.equal(episode.metrics.exactLocalityCuts, 12, record.id);
    assert.ok(episode.metrics.substantiveCuts >= 10, record.id);
    assert.equal(episode.reviewChecklist.length, 5, record.id);
    assert.ok(
      episode.chapters.every(
        (chapter) => chapter.promotionAllowed === false,
      ),
      record.id,
    );
    assert.ok(
      Object.values(episode.lanes)
        .filter(Boolean)
        .every(
          (lane) =>
            lane.status === "machine-candidate-review-required" &&
            lane.promotionAllowed === false,
        ),
      record.id,
    );
  }
});

test("all 336 excerpts are sixteen words or fewer and prove exact topic locality", () => {
  const captionsById = new Map();
  for (const record of guides) {
    const captionPath = path.join(
      ROOT,
      "source-cache",
      "captions",
      `${record.id}.json`,
    );
    const lines = parseCaptionLines(
      JSON.parse(fs.readFileSync(captionPath, "utf8")),
    );
    captionsById.set(record.id, lines);
    for (const cut of record.episodeGuide.cuts) {
      assert.ok(tokens(cut.excerpt).length <= 16, `${record.id} ${cut.id}`);
      assert.ok(tokens(cut.excerpt).length >= 4, `${record.id} ${cut.id}`);
      assert.doesNotMatch(cut.excerpt, /\[[^\]]+\]/, `${record.id} ${cut.id}`);
      assert.equal(cut.at, cut.evidence.captionAt, `${record.id} ${cut.id}`);
      assert.equal(
        cut.evidence.topicLocalityStatus,
        "exact-displayed-caption-window",
        `${record.id} ${cut.id}`,
      );
      assert.ok(
        cut.anchor.deltaSeconds <= cut.anchor.maxAllowedDeltaSeconds,
        `${record.id} ${cut.id}`,
      );
      assert.ok(
        topicEvidenceAppears(cut.excerpt, cut.topicEvidence),
        `${record.id} ${cut.id} ${cut.topicEvidence} :: ${cut.excerpt}`,
      );
      const localWindow = lines
        .filter(
          (line) =>
            Math.abs(line.at - cut.evidence.captionAt) <=
            cut.evidence.localWindowSeconds,
        )
        .map((line) => line.text)
        .join(" ");
      assert.ok(
        normalized(localWindow).includes(normalized(cut.excerpt)),
        `${record.id} ${cut.id} excerpt escaped its local caption window`,
      );
      assert.equal(cut.promotionAllowed, false, `${record.id} ${cut.id}`);
    }
  }
  assert.equal(captionsById.size, 28);
});

test("evaluation lanes require an evaluative cue and canonical subject in one excerpt", () => {
  const positive =
    /\b(?:love|loved|great|best|amazing|favorite|favourite|excellent|fantastic)\b/i;
  const negative =
    /\b(?:hate|hated|worst|terrible|awful|garbage|trash|sucks|stupid|atrocious)\b/i;
  for (const record of guides) {
    const { loved, hated } = record.episodeGuide.lanes;
    if (loved) {
      assert.match(loved.excerpt, positive, record.id);
      const cut = record.episodeGuide.cuts.find(
        (candidate) => candidate.id === loved.cutId,
      );
      assert.ok(cut, record.id);
      assert.ok(
        topicEvidenceAppears(loved.excerpt, cut.topicEvidence),
        record.id,
      );
    }
    if (hated) {
      assert.match(hated.excerpt, negative, record.id);
      const cut = record.episodeGuide.cuts.find(
        (candidate) => candidate.id === hated.cutId,
      );
      assert.ok(cut, record.id);
      assert.ok(
        topicEvidenceAppears(hated.excerpt, cut.topicEvidence),
        record.id,
      );
    }
  }
});

test("generated prose avoids speaker attribution and visual ranking outcomes", () => {
  const speakerClaim =
    /\b(?:Mike|J|Jay)\s+(?:says|said|calls|called|thinks|thought|hates|loves)\b|\bthey\s+(?:say|said|think|thought|love|hate)\b/i;
  const visualOutcomeClaim =
    /\b(?:wins?|won|winner|takes down|advances?|eliminat(?:e|ed|es)|beats?)\b/i;
  for (const record of guides) {
    const prose = generatedProse(record);
    assert.doesNotMatch(prose, speakerClaim, record.id);
    if (record.guideFormat === "ranking") {
      assert.doesNotMatch(prose, visualOutcomeClaim, record.id);
      assert.ok(
        record.episodeGuide.cuts.every(
          (cut) => !visualOutcomeClaim.test(cut.excerpt),
        ),
        record.id,
      );
      assert.match(record.episodeGuide.evidenceSummary, /No visual ranking result/i);
    }
  }
});

test("generated index and four shards are byte-for-byte deterministic", () => {
  const rendered = renderReviewBatchArtifacts(batch);
  assert.equal(rendered.size, 5);
  for (const [relativePath, contents] of rendered) {
    assert.equal(
      fs.readFileSync(path.join(ROOT, relativePath), "utf8"),
      contents,
      relativePath,
    );
  }

  const index = loadGlobal(
    INDEX_PATH,
    "WWAM_EPISODE_GUIDE_V2_REVIEW_BATCH_INDEX",
  );
  assert.deepEqual(index, batch.index);
  assert.deepEqual(
    batch.index.shards.map((shard) => shard.file),
    SHARD_PATHS,
  );
  for (const descriptor of batch.index.shards) {
    const shard = loadGlobal(descriptor.file, descriptor.global);
    assert.equal(shard.provenance.contentSha256, descriptor.contentSha256);
    assert.equal(shard.meta.guides, descriptor.guides);
    assert.deepEqual(
      shard.guides.map((guide) => guide.id),
      descriptor.ids,
    );
  }
});

test("review-batch artifacts stay isolated from the production app until review", () => {
  const app = fs.readFileSync(path.join(ROOT, "public", "demo", "app.js"), "utf8");
  const index = fs.readFileSync(
    path.join(ROOT, "public", "demo", "index.html"),
    "utf8",
  );
  assert.doesNotMatch(app, /WWAM_EPISODE_GUIDE_V2_REVIEW_BATCH/);
  assert.doesNotMatch(index, /episode-guide-v2-review-batch/);
});
