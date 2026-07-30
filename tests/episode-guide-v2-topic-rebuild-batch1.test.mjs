import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

import {
  TOPIC_REBUILD_BATCH1_CONFIGS,
  buildTopicRebuildBatch1,
  payloadContentSha256,
  renderTopicRebuildBatch1,
} from "../scripts/generate-episode-guide-v2-topic-rebuild-batch1.mjs";

const TEST_DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(TEST_DIR, "..");
const PUBLIC_PATH = path.join(
  ROOT,
  "public",
  "demo",
  "episode-guide-v2-topic-rebuild-batch1.js",
);
const EXPECTED_IDS = [
  "vjyNEQmgxC8",
  "Lllp-P-euww",
  "nv99WEtXGvE",
  "uA5lTCjk7sQ",
  "5T1wWUjCGWk",
];
const EXPECTED = {
  vjyNEQmgxC8: {
    title: "Let's Watch Scary Videos Together! Live!",
    format: "scary-video-watch-party",
    boundary: "source-audio-boundary-unverified",
  },
  "Lllp-P-euww": {
    title: "CHILD'S PLAY LIVE COMMENTARY",
    format: "movie-commentary",
    boundary: "source-audio-boundary-unverified",
  },
  nv99WEtXGvE: {
    title: "FREDDY KRUEGER Death Scenes Tier List Ranking!",
    format: "death-scene-tier-ranking",
    boundary: "film-clip-audio-boundary-unverified",
  },
  uA5lTCjk7sQ: {
    title: "We Watched A Movie LIVE! Superman Trailer & More!",
    format: "trailer-reaction",
    boundary: "source-audio-boundary-unverified",
  },
  "5T1wWUjCGWk": {
    title: "Halloween 4 Script Reading LIVE!",
    format: "script-reading",
    boundary: "script-origin-boundary-unverified",
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

const payload = buildTopicRebuildBatch1({ rootDir: ROOT });

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

test("freezes exactly the five requested thin topic-recap sources", () => {
  assert.equal(
    payload.schema,
    "wwam-episode-guide-v2-topic-rebuild-batch1/v1",
  );
  assert.deepEqual(payload.selection.ids, EXPECTED_IDS);
  assert.deepEqual(
    TOPIC_REBUILD_BATCH1_CONFIGS.map((config) => config.id),
    EXPECTED_IDS,
  );
  assert.equal(payload.selection.count, 5);
  assert.equal(payload.selection.integratedIntoSharedRuntime, false);
  assert.equal(payload.meta.guides, 5);
  assert.equal(payload.meta.cuts, 75);
  assert.equal(payload.meta.topicDoors, 22);
  assert.equal(payload.meta.evaluationCandidates, 36);
  assert.equal(payload.meta.comedyCandidates, 17);
});

test("canonical records, metadata, captions, and every recorded hash still agree", () => {
  for (const config of TOPIC_REBUILD_BATCH1_CONFIGS) {
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

test("every show has fifteen chronological, bounded, useful caption receipts", () => {
  for (const record of payload.guides) {
    const guide = record.episodeGuide;
    const ids = new Set(guide.cuts.map((cut) => cut.id));
    const classes = new Set(guide.cuts.map((cut) => cut.classification));

    assert.equal(guide.cuts.length, 15, record.id);
    assert.equal(ids.size, 15, record.id);
    assert.ok(
      classes.has("topic-door") || classes.has("format-cue"),
      record.id,
    );
    assert.ok(classes.has("evaluation-candidate"), record.id);
    assert.ok(classes.has("comedy-candidate"), record.id);
    assert.ok(guide.runtimeCoverage.spanPercent >= 45, record.id);
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

test("the shard preserves the source-audio firewall and makes no hidden attribution", () => {
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
  }
});

test("ranking language remains spoken-only and is never treated as board verification", () => {
  const ranking = payload.guides.find((guide) => guide.id === "nv99WEtXGvE");
  for (const cut of ranking.episodeGuide.cuts) {
    assert.equal(
      cut.evidence.placementStatus,
      "spoken-only-not-board-verified",
      cut.id,
    );
  }
  assert.ok(
    ranking.episodeGuide.evidenceLimitations.some((line) =>
      /not independent verification of an on-screen board/i.test(line),
    ),
  );
});

test("signature receipts survive with the intended evidence-safe lanes", () => {
  const byId = Object.fromEntries(
    payload.guides.map((record) => [record.id, record.episodeGuide.cuts]),
  );
  assert.equal(
    byId.vjyNEQmgxC8.find((cut) => cut.at === 10300).classification,
    "evaluation-candidate",
  );
  assert.equal(
    byId["Lllp-P-euww"].find((cut) => cut.at === 1784).classification,
    "comedy-candidate",
  );
  assert.match(
    byId.nv99WEtXGvE.find((cut) => cut.at === 8498).label,
    /STRAIGHT TO STEVE/,
  );
  assert.match(
    byId.uA5lTCjk7sQ.find((cut) => cut.at === 3930).label,
    /FIRST REACTION/,
  );
  assert.match(
    byId["5T1wWUjCGWk"].find((cut) => cut.at === 8321).label,
    /LOOMIS HIRES SLENDERMAN/,
  );
});

test("content hash, rebuild, and checked-in browser payload are deterministic", () => {
  assert.equal(
    payload.provenance.contentSha256,
    payloadContentSha256(payload),
  );
  assert.match(
    payload.provenance.contentSha256,
    /^sha256:[a-f0-9]{64}$/,
  );
  assert.deepEqual(
    buildTopicRebuildBatch1({ rootDir: ROOT }),
    payload,
  );
  assert.equal(
    fs.readFileSync(PUBLIC_PATH, "utf8"),
    renderTopicRebuildBatch1(payload),
  );

  const context = { window: {} };
  vm.createContext(context);
  vm.runInContext(fs.readFileSync(PUBLIC_PATH, "utf8"), context, {
    filename: PUBLIC_PATH,
  });
  assert.deepEqual(
    JSON.parse(
      JSON.stringify(
        context.window.WWAM_EPISODE_GUIDE_V2_TOPIC_REBUILD_BATCH1,
      ),
    ),
    payload,
  );
});
