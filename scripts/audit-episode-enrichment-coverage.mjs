import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";
import { auditEpisodeDepth } from "./audit-episode-depth.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const demo = path.join(root, "public", "demo");
const FACT_FILE_PATTERN = /^episode-facts-(?:pilot|batch\d+)\.js$/;
const REBUILD_FILE_PATTERN =
  /^episode-guide-v2-topic-rebuild-batch\d+\.js$/;

function array(value) {
  return Array.isArray(value) ? value : [];
}

function clean(value) {
  return String(value == null ? "" : value)
    .replace(/\s+/g, " ")
    .trim();
}

function countBy(values, getter) {
  return values.reduce((counts, item) => {
    const key = clean(getter(item)) || "NONE";
    counts[key] = (counts[key] || 0) + 1;
    return counts;
  }, {});
}

function loadEnrichmentPayloads() {
  const files = fs.readdirSync(demo)
    .filter((file) =>
      FACT_FILE_PATTERN.test(file) || REBUILD_FILE_PATTERN.test(file)
    )
    .sort();
  const sandbox = { window: {} };
  sandbox.self = sandbox.window;
  vm.createContext(sandbox);
  files.forEach((file) => {
    vm.runInContext(fs.readFileSync(path.join(demo, file), "utf8"), sandbox, {
      filename: file,
    });
  });

  const factPacks = [];
  const rebuildPacks = [];
  Object.entries(sandbox.window).forEach(([globalName, payload]) => {
    if (
      /^WWAM_EPISODE_FACTS_(?:PILOT|BATCH\d+)$/.test(globalName) &&
      Array.isArray(payload?.sources)
    ) {
      factPacks.push({ file: payloadFile(files, globalName), globalName, payload });
    }
    if (
      /^WWAM_EPISODE_GUIDE_V2_TOPIC_REBUILD_BATCH\d+$/.test(globalName) &&
      Array.isArray(payload?.guides)
    ) {
      rebuildPacks.push({
        file: payloadFile(files, globalName),
        globalName,
        payload,
      });
    }
  });
  return { files, factPacks, rebuildPacks };
}

function payloadFile(files, globalName) {
  const suffix = globalName
    .replace(/^WWAM_/, "")
    .toLowerCase()
    .replace(/_/g, "-");
  return files.find((file) =>
    file.replace(/\.js$/, "") === suffix
  ) || "";
}

function typedFactCount(source) {
  return Object.entries(source || {}).reduce((total, [key, value]) => {
    if (
      key === "phaseBoundaries" ||
      key === "topicRuns" ||
      key === "localReelAnchors"
    ) {
      return total;
    }
    return total + (Array.isArray(value) ? value.length : 0);
  }, 0);
}

function factRecords(factPacks) {
  return factPacks.flatMap((pack) =>
    array(pack.payload.sources).map((source) => ({
      sourceId: clean(source?.id),
      title: clean(source?.title),
      format: clean(source?.format),
      formatSpecificFactType: clean(source?.formatSpecificFactType),
      typedFacts: typedFactCount(source),
      phaseBoundaries: array(source?.phaseBoundaries).length,
      topicRuns: array(source?.topicRuns).length,
      localReelAnchors: array(source?.localReelAnchors).length,
      pack: pack.globalName,
      file: pack.file,
    }))
  );
}

function rebuildRecords(rebuildPacks) {
  return rebuildPacks.flatMap((pack) =>
    array(pack.payload.guides).map((guide) => {
      const cuts = array(guide?.episodeGuide?.cuts);
      return {
        sourceId: clean(guide?.id),
        title: clean(guide?.title),
        format: clean(guide?.episodeGuide?.format),
        stops: cuts.length,
        firstAt: cuts.length ? Number(cuts[0]?.at) || 0 : 0,
        lastEnd: cuts.length
          ? Number(cuts[cuts.length - 1]?.end) || 0
          : 0,
        duration: Number(guide?.duration) || 0,
        classifications: countBy(cuts, (cut) => cut?.classification),
        pack: pack.globalName,
        file: pack.file,
      };
    })
  );
}

function duplicates(records) {
  const index = new Map();
  records.forEach((record) => {
    const id = clean(record?.sourceId);
    if (!id) return;
    if (!index.has(id)) index.set(id, []);
    index.get(id).push(record.pack);
  });
  return Array.from(index.entries())
    .filter(([, packs]) => packs.length > 1)
    .map(([sourceId, packs]) => ({ sourceId, packs }));
}

export function auditEpisodeEnrichmentCoverage() {
  const depth = auditEpisodeDepth();
  const payloads = loadEnrichmentPayloads();
  const facts = factRecords(payloads.factPacks);
  const rebuilds = rebuildRecords(payloads.rebuildPacks);
  const readyIds = new Set(depth.shows.map((show) => show.sourceId));
  const advisoryIds = Array.from(new Set(
    depth.rankedIssues
      .filter((issue) =>
        issue.severity === "advisory" &&
        issue.metric === "generic-label-dominance"
      )
      .map((issue) => issue.sourceId),
  )).sort();
  const factIds = new Set(facts.map((record) => record.sourceId));
  const rebuildIds = new Set(rebuilds.map((record) => record.sourceId));
  const enrichedIds = new Set([...factIds, ...rebuildIds]);
  const enrichedWeakIds = advisoryIds.filter((id) => enrichedIds.has(id));
  const missingWeakIds = advisoryIds.filter((id) => !enrichedIds.has(id));
  const foreignFactIds = facts
    .filter((record) => !readyIds.has(record.sourceId))
    .map((record) => record.sourceId);
  const foreignRebuildIds = rebuilds
    .filter((record) => !readyIds.has(record.sourceId))
    .map((record) => record.sourceId);
  const invalidFacts = facts.filter((record) =>
    !record.sourceId ||
    !record.format ||
    !record.formatSpecificFactType ||
    record.typedFacts < 1
  );
  const invalidRebuilds = rebuilds.filter((record) =>
    !record.sourceId ||
    record.stops !== 15 ||
    record.firstAt < 0 ||
    record.lastEnd <= record.firstAt ||
    record.lastEnd > record.duration
  );
  const duplicateFactSources = duplicates(facts);
  const duplicateRebuildSources = duplicates(rebuilds);
  const sharedLayerIds = Array.from(factIds)
    .filter((id) => rebuildIds.has(id))
    .sort();
  const allReadyShowsHaveBaseline = depth.summary.pass &&
    depth.shows.length === depth.summary.corpus.readySources;
  const allWeakShowsHaveDeepLayer = missingWeakIds.length === 0;
  const payloadIntegrityPass =
    foreignFactIds.length === 0 &&
    foreignRebuildIds.length === 0 &&
    invalidFacts.length === 0 &&
    invalidRebuilds.length === 0 &&
    duplicateFactSources.length === 0 &&
    duplicateRebuildSources.length === 0;
  const gates = {
    allReadyShowsHaveBaseline,
    allWeakShowsHaveDeepLayer,
    payloadIntegrityPass,
  };

  return {
    schema: "wwam-episode-enrichment-coverage-audit/v1",
    generatedAt: new Date().toISOString(),
    corpus: {
      canonicalSources: depth.summary.corpus.canonicalSources,
      readySources: depth.summary.corpus.readySources,
      heldSources: depth.summary.corpus.heldSources,
      baselineWikiSources: depth.shows.length,
    },
    baseline: {
      depthReleasePass: depth.summary.pass,
      highlightStops: depth.summary.highlightDepth.total,
      averageHighlightStops: depth.summary.highlightDepth.average,
      blockers: depth.summary.issues.blockers,
      advisories: depth.summary.issues.advisories,
      repeatedHeadlines:
        depth.summary.headlineUniqueness?.repeatedGroups || 0,
    },
    enrichment: {
      factPacks: payloads.factPacks.length,
      factSources: factIds.size,
      typedFacts: facts.reduce(
        (total, record) => total + record.typedFacts,
        0,
      ),
      rebuildPacks: payloads.rebuildPacks.length,
      rebuildSources: rebuildIds.size,
      exactSourceStops: rebuilds.reduce(
        (total, record) => total + record.stops,
        0,
      ),
      uniqueDeepSources: enrichedIds.size,
      sharedLayerSources: sharedLayerIds.length,
      byFactFormat: countBy(facts, (record) => record.format),
      byRebuildFormat: countBy(rebuilds, (record) => record.format),
    },
    weakPageGate: {
      advisorySources: advisoryIds.length,
      enrichedSources: enrichedWeakIds.length,
      missingSources: missingWeakIds,
    },
    integrity: {
      invalidFacts: invalidFacts.map((record) => record.sourceId),
      invalidRebuilds: invalidRebuilds.map((record) => record.sourceId),
      foreignFactIds,
      foreignRebuildIds,
      duplicateFactSources,
      duplicateRebuildSources,
    },
    gates,
    pass: Object.values(gates).every(Boolean),
  };
}

function printHuman(report) {
  const lines = [
    "WWAM EPISODE ENRICHMENT COVERAGE AUDIT",
    `Corpus: ${report.corpus.canonicalSources} canonical // ` +
      `${report.corpus.readySources} ready // ${report.corpus.heldSources} held`,
    `Baseline: ${report.corpus.baselineWikiSources} structured episode wikis // ` +
      `${report.baseline.highlightStops} playable stops // ` +
      `${report.baseline.blockers} blockers // ` +
      `${report.baseline.repeatedHeadlines} repeated headlines`,
    `Deep layers: ${report.enrichment.factSources} typed-fact sources // ` +
      `${report.enrichment.typedFacts} typed facts // ` +
      `${report.enrichment.rebuildSources} rebuilt sources // ` +
      `${report.enrichment.exactSourceStops} exact-source stops`,
    `Weak-page gate: ${report.weakPageGate.enrichedSources}/` +
      `${report.weakPageGate.advisorySources} enriched`,
    `Payload integrity: ${
      report.gates.payloadIntegrityPass ? "PASS" : "FAIL"
    }`,
    `ENRICHMENT RELEASE GATE: ${report.pass ? "PASS" : "FAIL"}`,
  ];
  if (report.weakPageGate.missingSources.length) {
    lines.push(
      `Missing weak pages: ${report.weakPageGate.missingSources.join(", ")}`,
    );
  }
  process.stdout.write(`${lines.join("\n")}\n`);
}

const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : "";
if (invokedPath === fileURLToPath(import.meta.url)) {
  const report = auditEpisodeEnrichmentCoverage();
  if (process.argv.includes("--json")) {
    process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  } else if (process.argv.includes("--summary-json")) {
    process.stdout.write(`${JSON.stringify({
      corpus: report.corpus,
      baseline: report.baseline,
      enrichment: report.enrichment,
      weakPageGate: report.weakPageGate,
      gates: report.gates,
      pass: report.pass,
    }, null, 2)}\n`);
  } else {
    printHuman(report);
  }
  if (process.argv.includes("--check") && !report.pass) {
    process.exitCode = 1;
  }
}
