import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

import {
  TOPIC_REBUILD_BATCH2_CONFIGS,
  buildTopicRebuildBatch2,
  payloadContentSha256,
  renderTopicRebuildBatch2,
} from "../scripts/generate-episode-guide-v2-topic-rebuild-batch2.mjs";

const TEST_DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(TEST_DIR, "..");
const PUBLIC_PATH = path.join(
  ROOT,
  "public",
  "demo",
  "episode-guide-v2-topic-rebuild-batch2.js",
);
const EXPECTED_IDS = [
  "3Lu5KPrQhc8",
  "rLdk9JKeN68",
  "QxJyVaAgZ_Y",
  "bTzVQKD73L0",
  "KIGg_I72x_M",
];
const EXPECTED = {
  "3Lu5KPrQhc8": {
    title: "BRIDE OF CHUCKY LIVE COMMENTARY!",
    format: "movie-commentary",
    boundary: "source-audio-boundary-unverified",
  },
  rLdk9JKeN68: {
    title: "We Watched A Movie LIVE! Movie News + Trailers & More!",
    format: "trailer-reaction",
    boundary: "source-audio-boundary-unverified",
  },
  QxJyVaAgZ_Y: {
    title: "FRIDAY THE 13th Livestream! THE FINAL CHAPTER Watch Along",
    format: "watch-party",
    boundary: "film-audio-boundary-unverified",
  },
  bTzVQKD73L0: {
    title: "Let's Watch Scary Videos Together Live Part 2",
    format: "source-video-watch-party",
    boundary: "source-audio-boundary-unverified",
  },
  KIGg_I72x_M: {
    title: "We Watched A Movie LIVE 2/28 I Halloween Script Read!",
    format: "script-reading",
    boundary: "script-origin-boundary-unverified",
  },
};
const EXPECTED_COUNTS = {
  "3Lu5KPrQhc8": {
    "topic-door": 2,
    "format-cue": 3,
    "evaluation-candidate": 8,
    "comedy-candidate": 2,
  },
  rLdk9JKeN68: {
    "topic-door": 3,
    "format-cue": 2,
    "evaluation-candidate": 5,
    "comedy-candidate": 5,
  },
  QxJyVaAgZ_Y: {
    "topic-door": 0,
    "format-cue": 2,
    "evaluation-candidate": 11,
    "comedy-candidate": 2,
  },
  bTzVQKD73L0: {
    "topic-door": 4,
    "format-cue": 4,
    "evaluation-candidate": 5,
    "comedy-candidate": 2,
  },
  KIGg_I72x_M: {
    "topic-door": 3,
    "format-cue": 5,
    "evaluation-candidate": 4,
    "comedy-candidate": 3,
  },
};
const CLASSIFICATIONS = new Set([
  "topic-door",
  "format-cue",
  "evaluation-candidate",
  "comedy-candidate",
]);
const ATTRIBUTION_KEY =
  /^(?:speaker|speakerId|speakerName|host|hostId|performer|performerId|attributedTo|saidBy|quoteBy)$/i;

const payload = buildTopicRebuildBatch2({ rootDir: ROOT });

function clean(value) {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function wordCount(value) {
  return clean(value).match(/[A-Za-z0-9]+(?:['-][A-Za-z0-9]+)*/g)?.length || 0;
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
  const input = Buffer.isBuffer(value) ? value : Buffer.from(String(value));
  return `sha256:${crypto.createHash("sha256").update(input).digest("hex")}`;
}

function loadWindowAssignment(filePath, globalName) {
  const context = { window: {} };
  vm.createContext(context);
  vm.runInContext(fs.readFileSync(filePath, "utf8"), context, {
    filename: filePath,
  });
  return context.window[globalName];
}

function sourceRecords(value) {
  return value.streams || value.records || value.sources;
}

function findAttributionKeys(value, prefix = "", output = []) {
  if (!value || typeof value !== "object") return output;
  if (Array.isArray(value)) {
    value.forEach((item, index) =>
      findAttributionKeys(item, `${prefix}[${index}]`, output),
    );
    return output;
  }
  for (const [key, nested] of Object.entries(value)) {
    const location = prefix ? `${prefix}.${key}` : key;
    if (ATTRIBUTION_KEY.test(key)) output.push(location);
    findAttributionKeys(nested, location, output);
  }
  return output;
}

test("freezes exactly the next five weakest topic recaps after Batch 1", () => {
  assert.equal(
    payload.schema,
    "wwam-episode-guide-v2-topic-rebuild-batch2/v1",
  );
  assert.deepEqual(payload.selection.ids, EXPECTED_IDS);
  assert.deepEqual(
    TOPIC_REBUILD_BATCH2_CONFIGS.map((config) => config.id),
    EXPECTED_IDS,
  );
  assert.equal(payload.selection.count, 5);
  assert.equal(payload.selection.integratedIntoSharedRuntime, false);
  assert.equal(payload.meta.guides, 5);
  assert.equal(payload.meta.cuts, 75);
  assert.equal(payload.meta.topicDoors, 28);
  assert.equal(payload.meta.evaluationCandidates, 33);
  assert.equal(payload.meta.comedyCandidates, 14);
});

test("canonical records, metadata, captions, and hashes still agree", () => {
  for (const config of TOPIC_REBUILD_BATCH2_CONFIGS) {
    const record = payload.guides.find((guide) => guide.id === config.id);
    const expected = EXPECTED[config.id];
    const artifactPath = path.join(ROOT, config.artifact);
    const captionPath = path.join(
      ROOT,
      "source-cache",
      "captions",
      `${config.id}.json`,
    );
    const metadataPath = path.join(
      ROOT,
      "source-cache",
      "metadata",
      `${config.id}.json`,
    );
    const canonicalPayload = loadWindowAssignment(artifactPath, config.global);
    const canonicalSource = sourceRecords(canonicalPayload).find(
      (source) => source.id === config.id,
    );
    const metadata = JSON.parse(fs.readFileSync(metadataPath, "utf8"));

    assert.ok(canonicalSource, config.id);
    assert.equal(record.title, expected.title, config.id);
    assert.equal(record.title, canonicalSource.title, config.id);
    assert.equal(record.title, metadata.title, config.id);
    assert.equal(record.duration, Number(canonicalSource.duration), config.id);
    assert.equal(record.duration, Number(metadata.duration), config.id);
    assert.equal(record.episodeGuide.format, expected.format, config.id);
    assert.equal(record.rightsPolicy.mode, expected.boundary, config.id);
    assert.equal(
      record.inputEvidence.canonicalArtifactSha256,
      sha256(fs.readFileSync(artifactPath)),
      config.id,
    );
    assert.equal(
      record.inputEvidence.canonicalRecordSha256,
      sha256(JSON.stringify(stable(canonicalSource))),
      config.id,
    );
    assert.equal(
      record.inputEvidence.captionSha256,
      sha256(fs.readFileSync(captionPath)),
      config.id,
    );
    assert.equal(
      record.inputEvidence.metadataSha256,
      sha256(fs.readFileSync(metadataPath)),
      config.id,
    );
    assert.match(metadata.caption_url, /[?&]kind=asr(?:&|$)/, config.id);
    assert.match(metadata.caption_url, /[?&]lang=en(?:&|$)/, config.id);
  }
});

test("every show has fifteen chronological and bounded caption receipts", () => {
  for (const record of payload.guides) {
    const guide = record.episodeGuide;
    const ids = new Set(guide.cuts.map((cut) => cut.id));
    const classes = new Set(guide.cuts.map((cut) => cut.classification));

    assert.deepEqual(guide.classificationCounts, EXPECTED_COUNTS[record.id]);
    assert.equal(guide.cuts.length, 15, record.id);
    assert.equal(ids.size, 15, record.id);
    assert.ok(
      classes.has("topic-door") || classes.has("format-cue"),
      record.id,
    );
    assert.ok(classes.has("evaluation-candidate"), record.id);
    assert.ok(classes.has("comedy-candidate"), record.id);
    assert.ok(guide.runtimeCoverage.spanPercent >= 60, record.id);
    assert.match(guide.generationSha256, /^sha256:[a-f0-9]{64}$/, record.id);

    for (const [index, cut] of guide.cuts.entries()) {
      assert.ok(CLASSIFICATIONS.has(cut.classification), cut.id);
      assert.ok(cut.at >= 0, cut.id);
      assert.ok(cut.end > cut.at, cut.id);
      assert.ok(cut.end <= record.duration, cut.id);
      assert.ok(cut.end - cut.at <= 24, cut.id);
      assert.equal(cut.evidenceAt, cut.at, cut.id);
      assert.ok(!index || guide.cuts[index - 1].at < cut.at, cut.id);
      assert.ok(wordCount(cut.label) >= 2, cut.id);
      assert.ok(wordCount(cut.summary) >= 7, cut.id);
      assert.ok(wordCount(cut.excerpt) >= 4, cut.id);
      assert.ok(wordCount(cut.excerpt) <= 16, cut.id);
      assert.equal(cut.promotionAllowed, false, cut.id);
      assert.equal(cut.humanEditorialReviewPerformed, false, cut.id);
      assert.equal(
        cut.evidence.reviewStatus,
        "machine-surfaced-unreviewed",
        cut.id,
      );
      assert.equal(cut.evidence.speakerStatus, "not-diarized", cut.id);
      assert.equal(cut.evidence.performerStatus, "not-inferred", cut.id);
      assert.equal(
        cut.evidence.originStatus,
        "source-audio-boundary-unverified",
        cut.id,
      );
      assert.equal(cut.evidence.visualContextStatus, "not-verified", cut.id);
      assert.equal(cut.evidence.placementStatus, "not-applicable", cut.id);
      assert.equal(cut.evidence.promotionAllowed, false, cut.id);
      assert.equal(cut.evidence.humanReviewRequired, true, cut.id);

      if (cut.classification === "evaluation-candidate") {
        assert.equal(cut.claimLane, "spoken-evaluation-candidate", cut.id);
        assert.equal(cut.navigationOnly, false, cut.id);
        assert.equal(cut.candidateType, "evaluation", cut.id);
      } else if (cut.classification === "comedy-candidate") {
        assert.equal(cut.claimLane, "spoken-comedy-candidate", cut.id);
        assert.equal(cut.navigationOnly, false, cut.id);
        assert.equal(cut.candidateType, "comedy", cut.id);
      } else {
        assert.equal(cut.claimLane, "topic-navigation", cut.id);
        assert.equal(cut.navigationOnly, true, cut.id);
        assert.equal(cut.candidateType, null, cut.id);
      }
    }
  }
});

test("the shard preserves rights firewalls and makes no attribution", () => {
  assert.deepEqual(findAttributionKeys(payload), []);
  assert.equal(payload.policy.speakerAttributionAllowed, false);
  assert.equal(payload.policy.performerAttributionAllowed, false);
  assert.equal(payload.policy.originAttributionAllowed, false);
  assert.equal(payload.policy.visualClaimsAllowed, false);
  assert.equal(payload.policy.unverifiedPlacementClaimsAllowed, false);
  assert.equal(payload.policy.promotionAllowed, false);
  assert.equal(payload.policy.humanEditorialReviewPerformed, false);
  assert.equal(payload.policy.creatorApprovalClaimed, false);

  for (const record of payload.guides) {
    assert.equal(record.rightsPolicy.restrictedToTopicNavigation, true);
    assert.equal(record.rightsPolicy.speakerClaimsAllowed, false);
    assert.equal(record.rightsPolicy.performerClaimsAllowed, false);
    assert.equal(record.rightsPolicy.originClaimsAllowed, false);
    assert.equal(record.rightsPolicy.visualClaimsAllowed, false);
    assert.equal(record.rightsPolicy.visualResultClaimsAllowed, false);
    assert.equal(record.rightsPolicy.promotionAllowed, false);
    assert.equal(record.sourceState.promotionAllowed, false);
    assert.equal(record.sourceState.humanEditorialReviewPerformed, false);
    assert.equal(record.sourceState.creatorApprovalClaimed, false);
    assert.equal(record.episodeGuide.promotionAllowed, false);
    assert.equal(record.episodeGuide.humanEditorialReviewPerformed, false);
    assert.equal(record.episodeGuide.creatorApprovalClaimed, false);

    const prose = record.episodeGuide.cuts
      .map((cut) => `${cut.label} ${cut.summary}`)
      .join("\n");
    assert.doesNotMatch(
      prose,
      /\b(?:Mike|Jay|J)\s+(?:says|said|jokes|calls|places|ranks)\b/i,
      record.id,
    );
    assert.doesNotMatch(
      prose,
      /\b(?:we see|the screen shows|the scene shows|the image shows)\b/i,
      record.id,
    );
    assert.doesNotMatch(
      prose,
      /\b(?:played by|performed by|voiced by|read by)\b/i,
      record.id,
    );
  }
});

test("signature receipts retain their evidence-safe candidate lanes", () => {
  const byId = Object.fromEntries(
    payload.guides.map((record) => [record.id, record.episodeGuide.cuts]),
  );
  assert.match(
    byId["3Lu5KPrQhc8"].find((cut) => cut.at === 5520).label,
    /FINAL VERDICT/,
  );
  assert.equal(
    byId.rLdk9JKeN68.find((cut) => cut.at === 9653).classification,
    "evaluation-candidate",
  );
  assert.match(
    byId.QxJyVaAgZ_Y.find((cut) => cut.at === 10464).label,
    /FINAL CHAPTER VERDICT/,
  );
  assert.equal(
    byId.bTzVQKD73L0.find((cut) => cut.at === 4964).classification,
    "comedy-candidate",
  );
  assert.match(
    byId.KIGg_I72x_M.find((cut) => cut.at === 3660).label,
    /LOOMIS DREAM/,
  );
});

test("script reading and watch parties disclose the special evidence limits", () => {
  const script = payload.guides.find((guide) => guide.id === "KIGg_I72x_M");
  const film = payload.guides.find((guide) => guide.id === "QxJyVaAgZ_Y");
  const sourceVideo = payload.guides.find(
    (guide) => guide.id === "bTzVQKD73L0",
  );

  assert.ok(
    script.episodeGuide.evidenceLimitations.some((line) =>
      /generated-script words are not attributed/i.test(line),
    ),
  );
  for (const record of [film, sourceVideo]) {
    assert.ok(
      record.episodeGuide.evidenceLimitations.some((line) =>
        /source-video identity/i.test(line),
      ),
      record.id,
    );
  }
});

test("content hash, rebuild, and browser payload are deterministic", () => {
  assert.equal(
    payload.provenance.contentSha256,
    payloadContentSha256(payload),
  );
  assert.match(payload.provenance.contentSha256, /^sha256:[a-f0-9]{64}$/);
  assert.deepEqual(buildTopicRebuildBatch2({ rootDir: ROOT }), payload);
  assert.equal(
    fs.readFileSync(PUBLIC_PATH, "utf8"),
    renderTopicRebuildBatch2(payload),
  );

  const context = { window: {} };
  vm.createContext(context);
  vm.runInContext(fs.readFileSync(PUBLIC_PATH, "utf8"), context, {
    filename: PUBLIC_PATH,
  });
  assert.deepEqual(
    JSON.parse(
      JSON.stringify(
        context.window.WWAM_EPISODE_GUIDE_V2_TOPIC_REBUILD_BATCH2,
      ),
    ),
    payload,
  );
});
