import assert from "node:assert/strict";
import test from "node:test";

import {
  auditEditorialTruth,
  editorialTruthSummary,
} from "../scripts/audit-editorial-truth.mjs";

const HUMAN = "full-tape-human-editorial-read";
const STRUCTURED = "structured-source-summary";

function timed(count, duration, kind) {
  const width = Math.max(4, Math.floor(duration / (count * 2)));
  return Array.from({ length: count }, (_, index) => {
    const at = index * width * 2;
    const common = {
      at,
      end: Math.min(duration, at + width),
      label: `${kind.toUpperCase()} MOMENT ${index + 1}`,
    };
    return kind === "story"
      ? {
          ...common,
          body: `The conversation takes a distinct and readable turn during story beat ${index + 1}.`,
        }
      : {
          ...common,
          category: "WWAM UP IN YA",
          excerpt: `A memorable source-bounded joke lands during highlight number ${index + 1}.`
            .replace("source-bounded", "filthy little"),
        };
  });
}

function validPack(id = "human-show", duration = 10800, counts = {}) {
  const floors = duration >= 10800
    ? { story: 10, highlights: 15 }
    : duration >= 7200
      ? { story: 8, highlights: 10 }
      : duration >= 3600
        ? { story: 5, highlights: 6 }
        : { story: 3, highlights: 4 };
  return {
    sourceId: id,
    reviewState: HUMAN,
    evidence: { duration },
    label: "THE SHOW WITHOUT THE BULLSHIT",
    badge: "FULL TAPE EPISODE WIKI",
    headline: "BATMAN PANIC MEETS A FILTHY AFTERPARTY",
    deck: "The room argues about Batman, ruins dinner, and finds one joke nobody can survive.",
    overview: "A long horror-news night starts with studio panic, swerves into character comedy, and ends with the audience laughing at a truly terrible idea.",
    story: timed(counts.story ?? floors.story, duration, "story"),
    highlights: timed(
      counts.highlights ?? floors.highlights,
      duration,
      "highlight",
    ),
    fanRead: {
      wildestDetour: {
        label: "WWAM UP IN YA",
        topic: "The terrible idea",
        body: "The argument detonates into the kind of filthy side road that makes the whole room lose it.",
        at: 30,
        end: 60,
      },
    },
  };
}

function compiledHuman(pack) {
  return {
    id: pack.sourceId,
    title: "Human show",
    state: "ready",
    source: { id: pack.sourceId, duration: pack.evidence.duration },
    recap: {
      editorialState: HUMAN,
      label: pack.label,
      badge: pack.badge,
      headline: pack.headline,
      deck: pack.deck,
      overview: pack.overview,
      story: pack.story.map((item) => ({
        ...item,
        narrative: { kind: "human-editorial-story" },
        evidenceBasis: HUMAN,
      })),
      highlightRunway: pack.highlights.map((item) => ({
        ...item,
        kind: "human-editorial-highlight",
        evidenceBasis: HUMAN,
      })),
      bestMoments: pack.highlights.map((item) => ({
        ...item,
        kind: "human-editorial-highlight",
        evidenceBasis: HUMAN,
      })),
      caseFile: { humanEditorialRead: true },
      editorialEvidence: { duration: pack.evidence.duration },
      editorialPanels: pack.panels || [],
    },
  };
}

function compiledStructured(id = "unfinished", duration = 5400) {
  return {
    id,
    title: "Unfinished show",
    state: "ready",
    source: { id, duration },
    recap: {
      editorialState: STRUCTURED,
      deck: "",
      story: timed(5, duration, "story"),
      bestMoments: [],
      highlightRunway: [],
      caseFile: { humanEditorialRead: false },
      editorialEvidence: {},
      editorialPanels: [],
    },
  };
}

function registry(pack) {
  return {
    schema: "shokker-episode-editorial-packs/v1",
    sources: pack ? { [pack.sourceId]: pack } : {},
  };
}

test("valid human pack and safe unfinished summary pass progressive release", () => {
  const pack = validPack();
  const report = auditEditorialTruth(
    [compiledHuman(pack), compiledStructured()],
    registry(pack),
  );
  assert.equal(report.pass, true, JSON.stringify(report.failures, null, 2));
  assert.equal(report.corpus.humanApplied, 1);
  assert.equal(report.corpus.safeStructured, 1);
  assert.equal(report.corpus.missingHuman, 1);
  assert.equal(editorialTruthSummary(report).failures, undefined);
});

test("require-all-human fails while any ready show remains structured", () => {
  const pack = validPack();
  const report = auditEditorialTruth(
    [compiledHuman(pack), compiledStructured()],
    registry(pack),
    { requireAllHuman: true },
  );
  assert.equal(report.pass, false);
  assert.equal(report.counts["ready-source-missing-human-pack"], 1);
});

test("duration, bounds, uniqueness, encoding, jargon, and character truth fail closed", () => {
  const pack = validPack();
  pack.evidence.duration += 1;
  pack.story[1] = { ...pack.story[0] };
  pack.story[2].end = 99999;
  pack.story[3].body = "Machine-surfaced source-local filler â€” nope.";
  pack.highlights[0] = {
    ...pack.highlights[0],
    category: "CHARACTER PERFORMANCE",
    characters: [],
  };
  pack.highlights[1] = {
    ...pack.highlights[1],
    characters: ["Dr. Loomis"],
  };
  const applied = compiledHuman({
    ...pack,
    evidence: { duration: 10800 },
  });
  const report = auditEditorialTruth([applied], registry(pack));
  const codes = new Set(report.failures.map((item) => item.code));
  [
    "pack-duration-mismatch",
    "story-duplicate-window",
    "story-duplicate-label",
    "story-out-of-bounds",
    "copy-mojibake",
    "copy-backend-jargon",
    "character-performance-unconfirmed",
    "character-reference-promoted",
  ].forEach((code) => assert.equal(codes.has(code), true, code));
});

test("structured summaries cannot publish a deck, story, or fake human evidence", () => {
  const file = compiledStructured();
  file.recap.deck = "This pretends to be an authored episode deck.";
  file.recap.publicStory = file.recap.story;
  file.recap.bestMoments = [{
    kind: "human-editorial-highlight",
    evidenceBasis: HUMAN,
  }];
  const report = auditEditorialTruth([file], registry(null));
  const codes = new Set(report.failures.map((item) => item.code));
  assert.equal(codes.has("structured-summary-public-deck"), true);
  assert.equal(codes.has("structured-summary-public-story"), true);
  assert.equal(codes.has("structured-summary-fake-human"), true);
});

test("depth floors are minimums and never caps", () => {
  const pack = validPack("big-show", 14400, {
    story: 24,
    highlights: 37,
  });
  const report = auditEditorialTruth([compiledHuman(pack)], registry(pack));
  assert.equal(report.pass, true, JSON.stringify(report.failures, null, 2));
  assert.equal(report.floors.maximum, null);
});
