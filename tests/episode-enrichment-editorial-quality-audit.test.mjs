import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import {
  auditEpisodeEnrichmentEditorialQuality,
  discoverEpisodeEnrichmentPacks,
} from "../scripts/audit-episode-enrichment-editorial-quality.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");
const REQUIRED_PACKS = [
  "episode-facts-pilot.js",
  "episode-facts-batch2.js",
  "episode-guide-v2-topic-rebuild-batch1.js",
  "episode-guide-v2-topic-rebuild-batch2.js",
  "episode-guide-v2-topic-rebuild-batch3.js",
  "episode-guide-v2-topic-rebuild-batch4.js",
  "episode-guide-v2-topic-rebuild-batch5.js",
];
const EDITORIAL_BLOCKER_CODES = new Set([
  "generic-editorial-label",
  "missing-editorial-label",
  "missing-editorial-summary",
  "unreadable-editorial-copy",
  "raw-excerpt-used-as-summary",
  "machine-room-copy-leak",
  "unsupported-speaker-claim",
  "unsupported-visual-claim",
  "unsupported-evidence-claim",
  "invalid-source-id",
  "missing-source-metadata",
  "invalid-source-metadata",
  "source-identity-mismatch",
  "item-source-id-mismatch",
  "duplicate-item-id",
  "duplicate-editorial-label",
  "invalid-playback-window",
  "playback-evidence-mismatch",
  "invalid-response-window",
]);

function writeSyntheticPack(rootDir, items) {
  const publicDir = path.join(rootDir, "public", "demo");
  const metadataDir = path.join(rootDir, "source-cache", "metadata");
  fs.mkdirSync(publicDir, { recursive: true });
  fs.mkdirSync(metadataDir, { recursive: true });
  const source = {
    id: "abcdefghijk",
    title: "Synthetic Editorial Audit Show",
    duration: 200,
    format: "review-desk",
    formatSpecificFactType: "reviewMoments",
    reviewMoments: items,
  };
  const payload = {
    schema: "synthetic-episode-facts/v1",
    sources: [source],
  };
  fs.writeFileSync(
    path.join(publicDir, "episode-facts-batch99.js"),
    `window.WWAM_EPISODE_FACTS_BATCH99 = ${JSON.stringify(payload)};\n`,
  );
  fs.writeFileSync(
    path.join(metadataDir, "abcdefghijk.json"),
    JSON.stringify({
      id: "abcdefghijk",
      title: "Synthetic Editorial Audit Show",
      duration: 200,
    }),
  );
}

function writeSyntheticTopicRebuildPack(rootDir, cuts) {
  const publicDir = path.join(rootDir, "public", "demo");
  const metadataDir = path.join(rootDir, "source-cache", "metadata");
  fs.mkdirSync(publicDir, { recursive: true });
  fs.mkdirSync(metadataDir, { recursive: true });
  const source = {
    id: "abcdefghijk",
    title: "Synthetic Topic Rebuild Show",
    duration: 200,
    episodeGuide: {
      cuts,
    },
  };
  const payload = {
    schema: "synthetic-topic-rebuild/v1",
    guides: [source],
  };
  fs.writeFileSync(
    path.join(
      publicDir,
      "episode-guide-v2-topic-rebuild-batch99.js",
    ),
    `window.WWAM_EPISODE_GUIDE_V2_TOPIC_REBUILD_BATCH99 = ${JSON.stringify(payload)};\n`,
  );
  fs.writeFileSync(
    path.join(metadataDir, "abcdefghijk.json"),
    JSON.stringify({
      id: "abcdefghijk",
      title: "Synthetic Topic Rebuild Show",
      duration: 200,
    }),
  );
}

function validFact({
  id,
  label,
  at,
  end,
  summary,
  type = "reviewMoment",
  extra = {},
}) {
  return {
    id,
    type,
    label,
    at,
    end,
    excerpt: "short exact source fragment",
    claim: {
      text: summary,
    },
    evidence: {
      anchorAt: at,
    },
    ...extra,
  };
}

test("auto-discovers every current fact and topic-rebuild pack, including Batch 3 facts when present", () => {
  const files = discoverEpisodeEnrichmentPacks({ rootDir: ROOT });
  const names = files.map((filePath) => path.basename(filePath));
  for (const required of REQUIRED_PACKS) {
    assert.ok(names.includes(required), required);
  }
  const batch3Path = path.join(
    ROOT,
    "public",
    "demo",
    "episode-facts-batch3.js",
  );
  assert.equal(
    names.includes("episode-facts-batch3.js"),
    fs.existsSync(batch3Path),
  );
  assert.deepEqual(names, [...names].sort((left, right) =>
    left.localeCompare(right)
  ));
});

test("audits every format-specific public lane and records an input fingerprint", () => {
  const report = auditEpisodeEnrichmentEditorialQuality({
    rootDir: ROOT,
  });
  assert.equal(
    report.schema,
    "wwam-episode-enrichment-editorial-quality-audit/v1",
  );
  assert.equal(
    report.summary.packs,
    discoverEpisodeEnrichmentPacks({ rootDir: ROOT }).length,
  );
  assert.ok(report.summary.factPacks >= 2);
  assert.ok(report.summary.topicRebuildPacks >= 5);
  assert.ok(report.summary.sourceEntries >= 70);
  assert.ok(report.summary.uniqueSources >= 60);
  assert.ok(report.summary.items >= 850);
  assert.match(report.inputFingerprint, /^sha256:[a-f0-9]{64}$/);
  assert.equal(report.packs.length, report.summary.packs);
  for (const pack of report.packs) {
    assert.match(pack.sha256, /^sha256:[a-f0-9]{64}$/);
    assert.ok(pack.sources > 0, pack.file);
    assert.ok(pack.items > 0, pack.file);
    assert.equal(pack.sourceReports.length, pack.sources, pack.file);
  }
});

test("current packs have no generic copy, machine-room leaks, unsafe authority, identity drift, or broken bounds", () => {
  const report = auditEpisodeEnrichmentEditorialQuality({
    rootDir: ROOT,
  });
  const editorialBlockers = report.findings.filter((finding) =>
    EDITORIAL_BLOCKER_CODES.has(finding.code)
  );
  assert.deepEqual(editorialBlockers, []);
  assert.ok(
    report.findings.every((finding) =>
      [
        "non-chronological-playback",
        "thin-runtime-distribution",
      ].includes(finding.code)
    ),
  );
  assert.ok(
    report.findings
      .filter((finding) => finding.severity === "advisory")
      .every((finding) => finding.code === "thin-runtime-distribution"),
  );
});

test("chronology and distribution findings identify exact sources without overstating failure", () => {
  const report = auditEpisodeEnrichmentEditorialQuality({
    rootDir: ROOT,
  });
  for (const finding of report.findings) {
    assert.ok(finding.packFile);
    assert.ok(finding.sourceId);
    if (finding.code === "non-chronological-playback") {
      assert.equal(finding.severity, "blocker");
      assert.ok(finding.itemId);
      assert.ok(finding.detail.currentAt < finding.detail.previousAt);
    } else if (finding.code === "thin-runtime-distribution") {
      assert.equal(finding.severity, "advisory");
      assert.ok(finding.detail.spanPercent > 0);
      assert.ok(finding.detail.quartiles.length >= 1);
    }
  }
  assert.equal(
    report.summary.blockers,
    report.findings.filter((finding) => finding.severity === "blocker")
      .length,
  );
  assert.equal(
    report.summary.advisories,
    report.findings.filter((finding) => finding.severity === "advisory")
      .length,
  );
});

test("a synthetic bad pack proves the editorial, authority, chronology, and playback gates fail closed", () => {
  const rootDir = fs.mkdtempSync(
    path.join(os.tmpdir(), "wwam-editorial-audit-bad-"),
  );
  writeSyntheticPack(rootDir, [
    validFact({
      id: "abcdefghijk-review-01",
      label: "SPECIFIC OPENING VERDICT",
      at: 100,
      end: 110,
      summary: "The captioned review gives the opening a clear positive verdict.",
    }),
    validFact({
      id: "abcdefghijk-review-02",
      label: "MOMENT 2",
      at: 50,
      end: 250,
      summary:
        "Mike says the screen shows a runtime quantile result.",
      extra: {
        speaker: "Mike",
        visualResultClaim: true,
      },
    }),
  ]);

  const report = auditEpisodeEnrichmentEditorialQuality({ rootDir });
  const codes = new Set(report.findings.map((finding) => finding.code));
  assert.equal(report.summary.pass, false);
  assert.ok(codes.has("generic-editorial-label"));
  assert.ok(codes.has("machine-room-copy-leak"));
  assert.ok(codes.has("unsupported-speaker-claim"));
  assert.ok(codes.has("unsupported-visual-claim"));
  assert.ok(codes.has("unsupported-evidence-claim"));
  assert.ok(codes.has("non-chronological-playback"));
  assert.ok(codes.has("invalid-playback-window"));
});

test("format-native watchalong controls are not mislabeled as generic editorial copy", () => {
  const rootDir = fs.mkdtempSync(
    path.join(os.tmpdir(), "wwam-editorial-audit-sync-"),
  );
  writeSyntheticPack(rootDir, [
    validFact({
      id: "abcdefghijk-sync-01",
      type: "syncCue",
      label: "COUNTDOWN",
      at: 10,
      end: 20,
      summary:
        "The captions preserve the countdown used to synchronize playback.",
    }),
    validFact({
      id: "abcdefghijk-sync-02",
      type: "syncCue",
      label: "PRESS PLAY",
      at: 21,
      end: 30,
      summary:
        "The captions preserve the direct instruction to begin playback.",
    }),
  ]);

  const report = auditEpisodeEnrichmentEditorialQuality({ rootDir });
  assert.equal(
    report.findings.some((finding) =>
      finding.code === "generic-editorial-label"
    ),
    false,
  );
  assert.equal(report.summary.pass, true);
});

test("format-native topic-rebuild presenter labels remain valid only in their intended lanes", () => {
  const rootDir = fs.mkdtempSync(
    path.join(os.tmpdir(), "wwam-editorial-audit-topic-labels-"),
  );
  writeSyntheticTopicRebuildPack(rootDir, [
    {
      id: "abcdefghijk-topic-01",
      label: "ON-TAPE TAKE",
      classification: "evaluation-candidate",
      at: 10,
      end: 20,
      evidenceAt: 10,
      excerpt: "A captioned opinion from the source.",
      summary:
        "The source captions preserve a direct evaluative take on the subject.",
    },
    {
      id: "abcdefghijk-topic-02",
      label: "COMEDY BEAT",
      classification: "comedy-candidate",
      at: 30,
      end: 40,
      evidenceAt: 30,
      excerpt: "A captioned joke from the source.",
      summary:
        "The source captions preserve a compact joke with a clear comic turn.",
    },
  ]);

  const report = auditEpisodeEnrichmentEditorialQuality({ rootDir });
  assert.equal(
    report.findings.some((finding) =>
      finding.code === "generic-editorial-label"
    ),
    false,
  );
  assert.deepEqual(
    report.policy.formatNativeLabelExceptions.topicRebuildByClassification,
    {
      "evaluation-candidate": "on tape take",
      "comedy-candidate": "comedy beat",
    },
  );
  assert.equal(report.summary.pass, true);
});

test("topic-rebuild presenter labels fail closed when assigned to the wrong lane", () => {
  const rootDir = fs.mkdtempSync(
    path.join(os.tmpdir(), "wwam-editorial-audit-topic-label-misuse-"),
  );
  writeSyntheticTopicRebuildPack(rootDir, [
    {
      id: "abcdefghijk-topic-01",
      label: "COMEDY BEAT",
      classification: "evaluation-candidate",
      at: 10,
      end: 20,
      evidenceAt: 10,
      excerpt: "A captioned opinion from the source.",
      summary:
        "The source captions preserve a direct evaluative take on the subject.",
    },
  ]);

  const report = auditEpisodeEnrichmentEditorialQuality({ rootDir });
  assert.equal(
    report.findings.some((finding) =>
      finding.code === "generic-editorial-label"
    ),
    true,
  );
  assert.equal(report.summary.pass, false);
});

test("the audit report is deterministic for an unchanged artifact set", () => {
  const first = auditEpisodeEnrichmentEditorialQuality({
    rootDir: ROOT,
  });
  const second = auditEpisodeEnrichmentEditorialQuality({
    rootDir: ROOT,
  });
  assert.deepEqual(second, first);
});
