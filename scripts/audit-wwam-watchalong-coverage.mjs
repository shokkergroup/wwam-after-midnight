#!/usr/bin/env node

/**
 * Source-bounded completeness check for the WWAM watchalong registry.
 *
 * This deliberately audits the local channel metadata snapshot instead of
 * trusting a hand-entered count. A long-form title signal that is public but
 * absent from the canon is an error; members-only rows are reported as holds
 * so access limits cannot be mistaken for missed indexing.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const metadataDir = path.join(root, "source-cache", "metadata");
const canonPath = path.join(root, "public", "demo", "wwam-watchalong-canon.js");
const canonText = fs.readFileSync(canonPath, "utf8");
const canon = JSON.parse(canonText.replace(/^.*?window\.WWAM_WATCHALONG_CANON = /s, "").trim().replace(/;\s*$/, ""));
const canonIds = new Set((canon.episodes || []).map((episode) => episode.id));
const titleSignal = /commentary|watch\s*along|watch\s*party|full\s*movie|movie\s+of\s+the\s+week|live\s+commentary/i;

function readMetadata() {
  return fs.readdirSync(metadataDir)
    .filter((file) => file.endsWith(".json"))
    .map((file) => {
      try { return JSON.parse(fs.readFileSync(path.join(metadataDir, file), "utf8")); }
      catch { return null; }
    })
    .filter(Boolean);
}

const metadata = readMetadata();
const candidates = metadata.filter((record) => titleSignal.test(String(record.title || "")) && Number(record.duration || 0) >= 1800);
const missing = candidates.filter((record) => !canonIds.has(record.id));
const publicMissing = missing.filter((record) => String(record.availability || "").toLowerCase() === "public");
const heldMissing = missing.filter((record) => String(record.availability || "").toLowerCase() === "subscriber_only");
const unknownMissing = missing.filter((record) => !["public", "subscriber_only"].includes(String(record.availability || "").toLowerCase()));

const report = {
  schema: "shokker-wwam-watchalong-coverage-audit/v1",
  observedAt: new Date().toISOString(),
  metadataSources: metadata.length,
  longFormTitleCandidates: candidates.length,
  canonEpisodes: canonIds.size,
  publicMissing: publicMissing.length,
  membersOnlyHolds: heldMissing.length,
  unresolvedMissing: unknownMissing.length,
  missing: missing.map((record) => ({
    id: record.id,
    title: record.title,
    date: record.upload_date || record.date || null,
    duration: Number(record.duration || 0),
    availability: record.availability || "unknown",
    status: String(record.availability || "").toLowerCase() === "subscriber_only" ? "members-only-hold" : "needs-review",
  })),
  evidence: {
    canonPolicy: "public full-film sources plus explicitly separated podcast recoveries and adjacent leads",
    publicCompletenessRule: "every public long-form title signal must have a canon episode ID",
    currentCanonStats: canon.stats || null,
  },
};

console.log(JSON.stringify(report, null, 2));
if (publicMissing.length) {
  console.error(`ERROR: ${publicMissing.length} public long-form watchalong candidate(s) are absent from canon.`);
  process.exitCode = 1;
}
