import assert from "node:assert/strict";
import test from "node:test";

import {
  RUNTIME_FILES,
  auditClassifications,
  compileCanonicalSources,
  renderConciseReport,
  titleExpectation,
} from "../scripts/audit-episode-format-classification.mjs";

function plain(value) {
  return JSON.parse(JSON.stringify(value));
}

function titleSource(title) {
  return { id: "synthetic01", title, displayTitle: title };
}

const compiled = compileCanonicalSources();
const registry = compiled.runtime.WWAMEpisodeFormatContracts;
const report = plain(
  auditClassifications(compiled.sources, registry),
);

test("uses the canonical archive-completion compile path and normalizes all 510 sources", () => {
  assert.ok(RUNTIME_FILES.includes("archive-completion.js"));
  assert.ok(RUNTIME_FILES.includes("episode-format-contracts.js"));
  assert.ok(RUNTIME_FILES.includes("wwam-source-dossier-adapter.js"));
  assert.ok(RUNTIME_FILES.includes("source-dossier-engine.js"));
  assert.equal(compiled.adapterPayload.sources.length, 510);
  assert.equal(compiled.sources.length, 510);
  assert.deepEqual(report.corpus, {
    total: 510,
    ready: 509,
    held: 1,
  });
  assert.equal(
    compiled.sources.filter(
      (source) => source.showWiki.episodeRecap.state === "held",
    )[0].id,
    "AzrcgoyE7C4",
  );
});

test("checks every requested title family with compound-format precedence", () => {
  const fixtures = [
    [
      "FROM Season 3 Episode 1 Recap",
      "episode-recap",
      ["movie-review"],
      ["episode-recap"],
    ],
    [
      "Peacemaker Season 2 Post-Show",
      "episode-recap",
      ["movie-review"],
      ["episode-recap"],
    ],
    [
      "Halloween 4 Script Recap",
      "script",
      ["script"],
      ["generated-script-bit", "script-reading", "script-review"],
    ],
    [
      "Halloween Full Movie Commentary",
      "commentary",
      ["movie-companion"],
      ["movie-commentary"],
    ],
    [
      "Friday the 13th Watch Along",
      "watchalong",
      ["movie-companion"],
      ["movie-watchalong"],
    ],
    [
      "Let's Watch Scary Videos Together",
      "scary-video-watch-party",
      ["watch-party"],
      ["scary-video-watch-party"],
    ],
    [
      "Halloween Movie Watch Party",
      "movie-watch-party",
      ["movie-companion"],
      ["movie-watch-party"],
    ],
    [
      "Horror Movie Tier Lists LIVE",
      "ranking",
      ["ranking"],
      ["visual-ranking", "spoken-ranking"],
    ],
    [
      "Movie News + Scream Trailer LIVE",
      "mixed-news-trailer",
      ["mixed-news-trailer"],
      ["mixed-news-trailer"],
    ],
    [
      "Scream Teaser Breakdown",
      "trailer",
      ["trailer-coverage"],
      ["trailer-reaction", "trailer-breakdown"],
    ],
    [
      "Halloween Q & A LIVE",
      "q-and-a",
      ["audience-q-and-a"],
      ["q-and-a"],
    ],
    [
      "The Boogeyman Spoiler Party + Movie News",
      "review",
      ["movie-review"],
      ["spoiler-review"],
    ],
    [
      "Horror Movie News LIVE",
      "movie-news",
      ["movie-news"],
      ["movie-news"],
    ],
    [
      "Peacemaker Season 2 Review",
      "review",
      ["movie-review"],
      ["spoiler-review"],
    ],
  ];

  for (const [
    title,
    kind,
    expectedRuntimeFormats,
    expectedContracts,
  ] of fixtures) {
    const expected = plain(titleExpectation(titleSource(title)));
    assert.ok(expected, title);
    assert.equal(expected.kind, kind, title);
    assert.deepEqual(
      expected.expectedRuntimeFormats,
      expectedRuntimeFormats,
      title,
    );
    assert.deepEqual(
      expected.expectedContracts,
      expectedContracts,
      title,
    );
  }
  assert.equal(
    titleExpectation(titleSource("We Watched A Movie LIVE")),
    null,
  );
});

test("routes every explicit title signal into the matching format family", () => {
  assert.equal(report.registryVersion, "1.2.0");
  assert.equal(report.expectedTitleSignals, 258);
  assert.equal(report.untargetedTitles, 252);
  assert.equal(report.titleMismatchCount, 0);
  assert.equal(report.persistenceMismatchCount, 0);
  assert.equal(report.mismatchCount, 0);
  assert.deepEqual(report.mismatches, []);
  assert.equal(report.pass, true);
  const peacemaker = compiled.sources.find(
    (source) => source.id === "8nBNn8NY59k",
  );
  assert.equal(peacemaker.runtimeFormat.id, "movie-review");
  assert.equal(peacemaker.formatContract.id, "spoiler-review");
});

test("proves all 510 fresh classifications preserve normalized rights", () => {
  assert.equal(report.rightsRegressionCount, 0);
  assert.deepEqual(report.rightsRegressions, []);
  assert.deepEqual(report.registryFormatConflicts, []);
  assert.deepEqual(report.duplicateSourceIds, []);

  for (const source of compiled.sources) {
    const fresh = registry.classify(source);
    assert.deepEqual(
      plain(
        registry.rightsRegressions(
          source.rightsPolicy,
          fresh.rightsPolicy,
        ),
      ),
      [],
      source.id,
    );
    assert.equal(
      fresh.rawContentMode,
      source.rawContentMode,
      source.id,
    );
  }
});

test("keeps persisted classification identical to a fresh registry pass", () => {
  assert.equal(report.persistenceMismatchCount, 0);
  for (const source of compiled.sources) {
    const fresh = registry.classify(source);
    assert.equal(
      source.runtimeFormat.id,
      fresh.runtimeFormat.id,
      source.id,
    );
    assert.equal(source.subtype.id, fresh.subtype.id, source.id);
    assert.equal(
      source.formatContract.id,
      fresh.contractId,
      source.id,
    );
  }
});

test("renders a concise passing report after the review-title precedence repair", () => {
  const output = renderConciseReport(report);
  assert.match(
    output,
    /Sources: 510 \/\/ ready 509 \/\/ held 1/,
  );
  assert.match(output, /Registry: 1\.2\.0/);
  assert.match(output, /Mismatches: 0 \/\/ title 0 \/\/ persisted 0/);
  assert.match(output, /Rights regressions: 0/);
  assert.match(output, /RESULT: PASS/);
  assert.doesNotMatch(output, /MISMATCHES|Fix:/);
  assert.equal(output.split("\n").length, 8);
});

test("the audit is deterministic and rejects incomplete callers", () => {
  const second = plain(
    auditClassifications(compiled.sources, registry),
  );
  assert.deepEqual(second, report);
  assert.throws(
    () => auditClassifications({}, registry),
    /requires a source array/,
  );
  assert.throws(
    () => auditClassifications([], {}),
    /requires the episode-format registry/,
  );
});
