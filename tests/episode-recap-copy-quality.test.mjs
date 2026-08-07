import assert from "node:assert/strict";
import test from "node:test";

import {
  auditRecapCopy,
  compileCanonicalRecaps,
} from "../scripts/audit-episode-recap-copy-quality.mjs";

let cachedReport;

function archiveReport() {
  if (!cachedReport) {
    cachedReport = auditRecapCopy(compileCanonicalRecaps());
  }
  return cachedReport;
}

function qualitySummary(result) {
  return Object.entries(result.counts)
    .filter(([, count]) => count > 0)
    .map(([gate, count]) => `${gate}=${count}`)
    .join(", ");
}

function cleanFixture(id, title, copy) {
  return {
    id,
    title,
    state: "ready",
    tier: "full-chronicle",
    format: "livestream",
    source: {
      id,
      title,
      displayTitle: title,
    },
    recap: {
      label: "EPISODE WIKI",
      badge: "DEEP DIVE",
      headline: title.toUpperCase(),
      deck: copy.deck,
      overview: copy.overview,
      format: {
        label: "Livestream",
      },
      approval: {
        disclosure: copy.disclosure,
      },
      topics: [copy.topic],
      story: [
        {
          label: copy.storyLabel,
          body: copy.storyBody,
          primarySubject: copy.topic,
          topicLabels: [copy.topic],
        },
      ],
      sections: [
        {
          label: copy.sectionLabel,
          body: copy.sectionBody,
          subject: copy.topic,
          topicLabels: [copy.topic],
        },
      ],
      bestMoments: [],
      highlightRunway: [],
      topicMap: [],
      fanRead: {},
    },
  };
}

test("copy audit compiles every canonical Show Wiki dossier", () => {
  const result = archiveReport();

  assert.equal(result.schema, "wwam-episode-recap-copy-quality-audit/v1");
  assert.equal(result.corpus.canonicalSourcesCompiled, 510);
  assert.equal(result.corpus.ready, 509);
  assert.equal(result.corpus.held, 1);
  assert.equal(
    result.corpus.ready + result.corpus.held,
    result.corpus.canonicalSourcesCompiled,
  );
  // Quarantined machine-candidate fan cards are intentionally absent from the
  // public corpus. These floors are the current post-quarantine release
  // baseline, not the superseded pre-quarantine card count.
  assert.ok(result.corpus.publicFieldsAudited > 39_000);
  assert.ok(result.corpus.proseFieldsAudited > 3_000);
  assert.ok(result.corpus.authoredSentencesAudited > 7_000);
});

test("archive-authored recap copy clears every public quality gate", () => {
  const result = archiveReport();

  assert.equal(
    result.pass,
    true,
    `Archive recap-copy release gate failed: ${qualitySummary(result)}`,
  );
  assert.ok(Object.values(result.gates).every(Boolean));
});

test("clean human-facing recap copy passes without suppressing useful prose", () => {
  const files = [
    cleanFixture("clean-a", "The Autumn Horror Desk", {
      deck: "A sharp opening argument gives way to an unusually warm franchise debate.",
      overview: "The conversation starts with practical effects and closes on the movies everyone still rewatches.",
      disclosure: "Every written beat links back to a playable moment from this episode.",
      topic: "Practical Effects",
      storyLabel: "THE CREATURE TAKES THE FLOOR",
      storyBody: "Practical effects spark the first disagreement before the room discovers a shared favorite.",
      sectionLabel: "A MONSTER WORTH DEFENDING",
      sectionBody: "The crew compares handmade creature work with the cleaner digital alternative.",
    }),
    cleanFixture("clean-b", "The Midnight Sequel Trial", {
      deck: "A messy sequel bracket becomes a funny argument about endings that actually work.",
      overview: "The bracket moves from notorious misses to one finale the room can defend without apology.",
      disclosure: "Each written turn opens the matching moment from this individual broadcast.",
      topic: "Sequel Endings",
      storyLabel: "THE BRACKET BREAKS OPEN",
      storyBody: "Sequel endings divide the table until one unexpected defense changes the whole ranking.",
      sectionLabel: "THE LAST REEL WINS",
      sectionBody: "A late comparison explains why one risky finale outlives its weaker setup.",
    }),
  ];
  const result = auditRecapCopy(files, {
    pathologicalMoldPercent: 100,
    minimumPathologicalMoldRecaps: 2,
  });

  assert.equal(result.pass, true, qualitySummary(result));
  assert.ok(Object.values(result.counts).every((count) => count === 0));
});

test("the detector rejects empty, machine-like, broken, and repeated copy", () => {
  const repeatedDeck =
    "This generic sentence repeats across every synthetic recap without any useful variation.";
  const bad = cleanFixture("bad-a", "Broken Archive Copy", {
    deck: repeatedDeck,
    overview:
      "The canonical artifact exposes an undefined schema payload to the public.",
    disclosure: "Every written beat links back to this individual broadcast.",
    topic: "Broken Copy",
    storyLabel: "BROKEN OPENING",
    storyBody:
      "The source-local topic map opens a replay lane where matched mentions are registered.",
    sectionLabel: "BROKEN TEMPLATE",
    sectionBody: "This {{template_token}} should never reach a public recap.",
  });
  bad.recap.headline = "";
  bad.recap.badge = "(UNBALANCED";
  bad.recap.story.push({
    label: "BROKEN FRAGMENT",
    body: "Because this",
    primarySubject: "Broken Copy",
    topicLabels: ["Broken Copy"],
  });
  const duplicated =
    "This duplicated paragraph appears in two separate public cards without a reason.";
  bad.recap.sections.push(
    {
      label: "DUPLICATE ONE",
      body: duplicated,
      subject: "Broken Copy",
      topicLabels: ["Broken Copy"],
    },
    {
      label: "DUPLICATE TWO",
      body: duplicated,
      subject: "Broken Copy",
      topicLabels: ["Broken Copy"],
    },
    {
      label: "REPEATED SENTENCE",
      body:
        "This sentence repeats inside one field without any editorial reason. " +
        "This sentence repeats inside one field without any editorial reason.",
      subject: "Broken Copy",
      topicLabels: ["Broken Copy"],
    },
  );

  const companion = cleanFixture("bad-b", "Second Broken Archive Copy", {
    deck: repeatedDeck,
    overview:
      "A second synthetic episode exists only to exercise the corpus repetition check.",
    disclosure: "Every written turn opens the matching moment from this episode.",
    topic: "Synthetic Testing",
    storyLabel: "SECOND OPENING",
    storyBody:
      "A distinct opening sentence keeps the negative fixture structurally complete.",
    sectionLabel: "SECOND SECTION",
    sectionBody:
      "Another distinct paragraph prevents unrelated duplicate-copy failures.",
  });
  const result = auditRecapCopy([bad, companion], {
    pathologicalMoldPercent: 100,
    minimumPathologicalMoldRecaps: 2,
  });

  assert.equal(result.pass, false);
  assert.ok(result.counts.emptyFields > 0);
  assert.ok(result.counts.machineRoomLeaks > 0);
  assert.ok(result.counts.editorialJargonLeaks > 0);
  assert.ok(result.counts.gibberishLeaks > 0);
  assert.ok(result.counts.brokenFragments > 0);
  assert.ok(result.counts.unbalancedPunctuation > 0);
  assert.ok(result.counts.duplicateProseGroups > 0);
  assert.ok(result.counts.repeatedSentences > 0);
  assert.ok(result.counts.pathologicalCrossCorpusMolds > 0);
  assert.ok(Object.values(result.gates).some((gate) => gate === false));
});
