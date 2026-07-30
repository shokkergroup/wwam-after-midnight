import test from "node:test";
import assert from "node:assert/strict";
import {
  auditEpisodeEnrichmentCoverage,
} from "../scripts/audit-episode-enrichment-coverage.mjs";

const report = auditEpisodeEnrichmentCoverage();

test("every ready show has a complete wiki baseline", () => {
  assert.equal(report.corpus.canonicalSources, 510);
  assert.equal(report.corpus.readySources, 509);
  assert.equal(report.corpus.heldSources, 1);
  assert.equal(report.corpus.baselineWikiSources, 509);
  assert.equal(report.baseline.blockers, 0);
  assert.equal(report.baseline.repeatedHeadlines, 0);
  assert.equal(report.gates.allReadyShowsHaveBaseline, true);
});

test("every weak archive page has an exact-source enrichment layer", () => {
  assert.ok(report.weakPageGate.advisorySources >= 36);
  assert.deepEqual(report.weakPageGate.missingSources, []);
  assert.equal(
    report.weakPageGate.enrichedSources,
    report.weakPageGate.advisorySources,
  );
  assert.equal(report.gates.allWeakShowsHaveDeepLayer, true);
});

test("deep enrichment payloads are canonical and internally sound", () => {
  assert.deepEqual(report.integrity.invalidFacts, []);
  assert.deepEqual(report.integrity.invalidRebuilds, []);
  assert.deepEqual(report.integrity.foreignFactIds, []);
  assert.deepEqual(report.integrity.foreignRebuildIds, []);
  assert.deepEqual(report.integrity.duplicateFactSources, []);
  assert.deepEqual(report.integrity.duplicateRebuildSources, []);
  assert.equal(report.gates.payloadIntegrityPass, true);
  assert.equal(report.pass, true);
});
