import assert from "node:assert/strict";
import test from "node:test";

import {
  PUBLIC_STRUCTURE_AUDIT_SCHEMA,
  auditEpisodeRecapPublicStructure,
  compileAndAuditEpisodeRecapPublicStructure,
  parsePublicClockTokens,
} from "../scripts/audit-episode-recap-public-structure.mjs";

let cachedArchiveReport;

function archiveReport() {
  if (!cachedArchiveReport) {
    cachedArchiveReport = compileAndAuditEpisodeRecapPublicStructure();
  }
  return cachedArchiveReport;
}

function cleanFixture() {
  return {
    id: "synthetic-clean",
    title: "A Clean Synthetic Episode",
    state: "ready",
    tier: "full-chronicle",
    format: "livestream",
    source: {
      id: "synthetic-clean",
      title: "A Clean Synthetic Episode",
      duration: 600,
      receipts: [
        {
          key: "synthetic-clean:receipt:60",
          at: 60,
          end: 90,
          evidenceBasis: "human-reviewed-source-window",
          reviewStatus: "reviewed",
          promotionAllowed: true,
        },
        {
          key: "synthetic-clean:receipt:180",
          at: 180,
          end: 210,
          evidenceBasis: "human-reviewed-source-window",
          reviewStatus: "reviewed",
          promotionAllowed: true,
        },
      ],
      showWiki: {
        episodeGuide: {
          schema: "wwam-episode-guide/v2",
          cuts: [
            {
              id: "synthetic-clean:cut:180",
              at: 180,
              end: 210,
              evidenceBasis: "human-reviewed-source-window",
              evidence: {
                reviewStatus: "reviewed",
                promotionAllowed: true,
              },
            },
          ],
        },
      },
    },
    recap: {
      schema: "wwam-feldman-recap/v1",
      state: "ready",
      tier: "full-chronicle",
      label: "EPISODE RECAP",
      badge: "DEEP DIVE",
      headline: "A CLEAN SYNTHETIC EPISODE",
      deck: "Two local, playable moments carry this small structural fixture.",
      overview: "The fixture covers an opening subject and a later turn.",
      sections: [
        {
          id: "act-01",
          label: "THE DOOR OPENS // ALPHA",
          body: "At 1:00, Alpha opens the conversation.",
          at: 60,
          displayAt: 60,
          subject: "Alpha",
          subjectFirstAt: 60,
          subjectPeakAt: 60,
          subjectMentions: 3,
          receiptKeys: ["synthetic-clean:receipt:60"],
        },
        {
          id: "act-02",
          label: "THE NEXT TURN // BETA",
          body: "At 3:00, Beta takes the next turn.",
          at: 180,
          displayAt: 180,
          subject: "Beta",
          subjectFirstAt: 180,
          subjectPeakAt: 180,
          subjectMentions: 2,
          receiptKeys: ["synthetic-clean:receipt:180"],
        },
      ],
      story: [
        {
          id: "reel-01",
          label: "OPENING // ALPHA",
          body: "At 1:00, Alpha opens the reel and stays in view through 2:00.",
          at: 60,
          end: 120,
          displayAt: 60,
          displayEnd: 120,
          primarySubject: "Alpha",
          receiptKey: "synthetic-clean:receipt:60",
        },
      ],
      fanRead: {
        loved: {
          label: "WHAT THE TAPE DEFENDED",
          topic: "Beta",
          body: "At 3:00, Beta gets the clearest reviewed defense.",
          at: 180,
          end: 210,
          receiptKey: "synthetic-clean:receipt:180",
          evidenceBasis: "human-reviewed-source-window",
          reviewStatus: "reviewed",
          promotionAllowed: true,
        },
      },
      caseFile: {
        lastPlayableAnchorPercent: 95,
        closingPhaseCovered: true,
      },
    },
  };
}

function auditOne(file, options = {}) {
  return auditEpisodeRecapPublicStructure([file], {
    expectedCanonicalSources: 1,
    globalTopicCompleteFrame: false,
    ...options,
  });
}

function expectFailure(result, key) {
  assert.equal(result.pass, false);
  assert.ok(
    result.counts[key] > 0,
    `Expected ${key}, got ${JSON.stringify(result.counts)}`,
  );
  assert.equal(result.gates[key], false);
}

test("public-structure audit compiles every canonical dossier without pinning iteration counts", () => {
  const result = archiveReport();

  assert.equal(result.schema, PUBLIC_STRUCTURE_AUDIT_SCHEMA);
  assert.equal(result.corpus.canonicalSourcesCompiled, 510);
  assert.equal(
    result.corpus.ready + result.corpus.held,
    result.corpus.canonicalSourcesCompiled,
  );
  assert.ok(result.corpus.sections > 0);
  assert.ok(result.corpus.storySegments > 0);
  assert.ok(result.corpus.fanCards > 0);
  assert.equal(typeof result.pass, "boolean");
  assert.ok(
    Object.values(result.counts).every((count) => Number.isInteger(count)),
  );
});

test("a locally aligned, reviewed synthetic recap clears every structural gate", () => {
  const result = auditOne(cleanFixture());

  assert.equal(result.pass, true, JSON.stringify(result.failures, null, 2));
  assert.ok(Object.values(result.counts).every((count) => count === 0));
});

test("clock parser handles public mm:ss and h:mm:ss coordinates", () => {
  assert.deepEqual(
    parsePublicClockTokens("Open 7:06, revisit 1:02:03, then stop."),
    [
      { text: "7:06", seconds: 426, index: 5 },
      { text: "1:02:03", seconds: 3723, index: 19 },
    ],
  );
});

test("synthetic section controls reject display/local drift and backward visible time", async (t) => {
  await t.test("displayAt differs from the section-local at", () => {
    const file = cleanFixture();
    file.recap.sections[0].displayAt = 61;

    expectFailure(
      auditOne(file),
      "sectionDisplayAtLocalAtMismatches",
    );
  });

  await t.test("visible section times move backward", () => {
    const file = cleanFixture();
    file.source.receipts.push({
      key: "synthetic-clean:receipt:30",
      at: 30,
      end: 45,
      reviewStatus: "reviewed",
      promotionAllowed: true,
    });
    Object.assign(file.recap.sections[1], {
      body: "At 0:30, Beta moves backward on the visible rail.",
      at: 30,
      displayAt: 30,
      receiptKeys: ["synthetic-clean:receipt:30"],
    });

    expectFailure(
      auditOne(file),
      "nonMonotonicVisibleSectionTimes",
    );
  });
});

test("synthetic body/play controls reject disagreement and missing coordinates", async (t) => {
  await t.test("body clock disagrees with the resolved play receipt", () => {
    const file = cleanFixture();
    file.recap.sections[0].body =
      "At 1:01, this sentence points one second away from its play action.";

    expectFailure(auditOne(file), "bodyPlayCoordinateMismatches");
  });

  await t.test("a playable public body omits its clock", () => {
    const file = cleanFixture();
    file.recap.fanRead.loved.body =
      "Beta gets the clearest reviewed defense.";

    const result = auditOne(file);
    expectFailure(result, "bodyPlayCoordinateMismatches");
    assert.ok(
      result.failures.bodyPlayCoordinateMismatches.some(
        (failure) => failure.kind === "missing-body-clock",
      ),
    );
  });

  await t.test("editorial prose may omit a clock when its play coordinate is explicit", () => {
    const file = cleanFixture();
    file.recap.sections[0].body = "Alpha gets a clean editorial read without a timestamp in the sentence.";
    file.recap.sections[0].playAt = 60;

    const result = auditOne(file);
    assert.equal(result.pass, true, JSON.stringify(result.failures, null, 2));
    assert.equal(result.counts.bodyPlayCoordinateMismatches, 0);
  });

  await t.test("a public body references no resolvable play action", () => {
    const file = cleanFixture();
    delete file.recap.sections[0].receiptKeys;

    const result = auditOne(file);
    expectFailure(result, "bodyPlayCoordinateMismatches");
    assert.ok(
      result.failures.bodyPlayCoordinateMismatches.some(
        (failure) => failure.kind === "unresolved-play-coordinate",
      ),
    );
  });
});

test("synthetic story controls reject subject drift and out-of-window clocks", async (t) => {
  await t.test("label suffix differs from primarySubject", () => {
    const file = cleanFixture();
    file.recap.story[0].label = "OPENING // BETA";

    expectFailure(
      auditOne(file),
      "storyLabelPrimarySubjectMismatches",
    );
  });

  await t.test("a later body clock falls outside displayAt/displayEnd", () => {
    const file = cleanFixture();
    file.recap.story[0].body =
      "At 1:00, Alpha opens the reel; an unrelated claim points to 2:01.";

    expectFailure(
      auditOne(file),
      "storyClockOutsideDisplayWindow",
    );
  });
});

test("synthetic fan-read controls reject every prohibited evidence state", async (t) => {
  const cases = [
    ["quarantined", "archive-deep-quarantined-candidate"],
    ["machine-candidate", "machine-candidate"],
    ["review-required", "review-required"],
  ];
  for (const [name, evidenceBasis] of cases) {
    await t.test(name, () => {
      const file = cleanFixture();
      file.recap.fanRead.loved.evidenceBasis = evidenceBasis;

      expectFailure(auditOne(file), "unsafePublicFanReadEvidence");
    });
  }

  await t.test("unsafe state inherited from the linked guide cut", () => {
    const file = cleanFixture();
    Object.assign(file.recap.fanRead.loved, {
      receiptKey: "",
      guideCutId: "synthetic-clean:cut:180",
      evidenceBasis: "topic-peak",
    });
    file.source.showWiki.episodeGuide.cuts[0].evidence.reviewStatus =
      "machine-candidate-unreviewed";
    file.source.showWiki.episodeGuide.cuts[0].evidence.promotionAllowed = false;

    expectFailure(auditOne(file), "unsafePublicFanReadEvidence");
  });
});

test("repeated section subject metrics require distinct visible local coordinates", () => {
  const file = cleanFixture();
  const duplicate = structuredClone(file.recap.sections[0]);
  duplicate.id = "act-01-duplicate";
  duplicate.label = "THE SAME GLOBAL PAYLOAD // ALPHA";
  file.recap.sections = [file.recap.sections[0], duplicate];

  expectFailure(
    auditOne(file),
    "duplicateSectionPayloadsWithoutDistinctLocalCoordinates",
  );
});

test("repeated global metrics are allowed when each section exposes a distinct local coordinate", () => {
  const file = cleanFixture();
  Object.assign(file.recap.sections[1], {
    subject: "Alpha",
    subjectFirstAt: 60,
    subjectPeakAt: 60,
    subjectMentions: 3,
    label: "ALPHA RETURNS // ALPHA",
  });

  const result = auditOne(file);
  assert.equal(
    result.counts.duplicateSectionPayloadsWithoutDistinctLocalCoordinates,
    0,
  );
  assert.equal(result.pass, true, JSON.stringify(result.failures, null, 2));
});

test("sub-85-percent topic maps cannot claim complete framing", async (t) => {
  await t.test("recap copy claims a full source map", () => {
    const file = cleanFixture();
    file.tier = "topic-recap";
    file.recap.tier = "topic-recap";
    file.recap.caseFile.lastPlayableAnchorPercent = 60;
    file.recap.badge = "FULL SOURCE MAP";

    expectFailure(
      auditOne(file),
      "incompleteTopicMapsFramedAsComplete",
    );
  });

  await t.test("the shared topic UI claims a full source map", () => {
    const file = cleanFixture();
    file.tier = "topic-recap";
    file.recap.tier = "topic-recap";
    file.recap.caseFile.lastPlayableAnchorPercent = 60;
    file.recap.badge = "PARTIAL SUBJECT MAP";

    expectFailure(
      auditOne(file, { globalTopicCompleteFrame: "FULL SOURCE MAP" }),
      "incompleteTopicMapsFramedAsComplete",
    );
  });

  await t.test("explicit partial framing remains valid below 85 percent", () => {
    const file = cleanFixture();
    file.tier = "topic-recap";
    file.recap.tier = "topic-recap";
    file.recap.caseFile.lastPlayableAnchorPercent = 60;
    file.recap.caseFile.closingPhaseCovered = false;
    file.recap.badge = "PARTIAL SUBJECT MAP";
    file.recap.headline = "A PLAYABLE ROUTE THROUGH THE INDEXED SUBJECTS";
    file.recap.story[0].label = "FIRST TOPIC // ALPHA";

    const result = auditOne(file);
    assert.equal(result.pass, true, JSON.stringify(result.failures, null, 2));
  });
});
