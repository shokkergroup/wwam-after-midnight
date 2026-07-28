import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function readAssignment(file) {
  const source = fs.readFileSync(path.join(ROOT, "public", "demo", file), "utf8");
  const equals = source.indexOf("=");
  assert.ok(equals >= 0, `${file} must contain a window assignment`);
  return JSON.parse(source.slice(equals + 1).trim().replace(/;$/, ""));
}

function words(value) {
  return String(value || "").toLowerCase().match(/[a-z0-9']+/g) || [];
}

function sixGrams(value) {
  const tokens = words(value);
  const grams = new Set();
  for (let index = 0; index <= tokens.length - 6; index += 1) {
    grams.add(tokens.slice(index, index + 6).join(" "));
  }
  return grams;
}

function visibleNarrative(guide) {
  return [
    guide.overview,
    ...guide.chapters.map((chapter) => chapter.body),
    ...guide.takeArc.map((take) => take.body),
    guide.fanRead.whyThisNightMatters.body,
    ...["loved", "hated", "wildestDetour", "lastWord"]
      .map((key) => guide.fanRead[key]?.body || "")
      .filter(Boolean),
  ].join(" ");
}

function jaccard(left, right) {
  let shared = 0;
  for (const value of left) if (right.has(value)) shared += 1;
  const union = left.size + right.size - shared;
  return union ? shared / union : 0;
}

function quotedWords(body) {
  const match = String(body || "").match(/\u201c([^\u201d]+)\u201d/);
  return match ? words(match[1]) : [];
}

function assertQuoteBoundToExcerpt(body, excerpt, label) {
  const quote = quotedWords(body);
  assert.ok(quote.length >= 3, `${label} needs a substantive exact-source fragment`);
  const haystack = ` ${words(excerpt).join(" ")} `;
  const needle = ` ${quote.join(" ")} `;
  assert.ok(haystack.includes(needle), `${label} quote must exist inside its registered cut`);
}

const payload = readAssignment("episode-guides.js");
const records = payload.guides;

test("all 38 fan-visible guides remain quantitatively distinct", (t) => {
  assert.equal(records.length, 38);
  const gramSets = records.map((record) => sixGrams(visibleNarrative(record.episodeGuide)));
  const guideCounts = new Map();
  for (const grams of gramSets) {
    for (const gram of grams) guideCounts.set(gram, (guideCounts.get(gram) || 0) + 1);
  }

  let closest = { score: 0, left: "", right: "" };
  for (let left = 0; left < gramSets.length; left += 1) {
    for (let right = left + 1; right < gramSets.length; right += 1) {
      const score = jaccard(gramSets[left], gramSets[right]);
      if (score > closest.score) {
        closest = { score, left: records[left].id, right: records[right].id };
      }
    }
  }

  const majorityFloor = Math.floor(records.length / 2) + 1;
  const majorityTemplates = [...guideCounts]
    .filter(([, count]) => count >= majorityFloor)
    .sort((left, right) => right[1] - left[1]);

  t.diagnostic(
    `closest six-gram pair ${closest.left}/${closest.right}: ${closest.score.toFixed(3)}; ` +
      `phrases shared by a majority: ${majorityTemplates.length}`,
  );
  assert.ok(
    closest.score < 0.14,
    `closest guide pair is still too templated: ${closest.left}/${closest.right} ${closest.score}`,
  );
  assert.deepEqual(
    majorityTemplates,
    [],
    "no six-word sentence mold may appear in a majority of the 38 guides",
  );
});

test("every authored guide layer carries a short fragment from its registered source cut", () => {
  let anchored = 0;
  for (const record of records) {
    const guide = record.episodeGuide;
    const cuts = new Map(guide.cuts.map((cut) => [cut.id, cut]));
    const strongest = cuts.get(guide.fanRead.whyThisNightMatters.strongestCutId);
    assert.ok(strongest, `${record.id} must register its strongest cut`);
    assert.equal(
      strongest.topicBasis,
      "local-caption-match",
      `${record.id} must-hear cut needs local topic evidence`,
    );
    assertQuoteBoundToExcerpt(guide.overview, strongest.excerpt, `${record.id}:overview`);
    assertQuoteBoundToExcerpt(
      guide.fanRead.whyThisNightMatters.body,
      strongest.excerpt,
      `${record.id}:why-this-night-matters`,
    );
    anchored += 2;

    for (const chapter of guide.chapters) {
      const cut = cuts.get(chapter.cutId);
      assert.ok(cut, `${record.id}:${chapter.id} cut must exist`);
      assertQuoteBoundToExcerpt(chapter.body, cut.excerpt, `${record.id}:${chapter.id}`);
      anchored += 1;
    }
    for (const take of guide.takeArc) {
      const cut = cuts.get(take.cutId);
      assert.ok(cut, `${record.id}:${take.phase} cut must exist`);
      assertQuoteBoundToExcerpt(take.body, cut.excerpt, `${record.id}:${take.phase}`);
      anchored += 1;
    }
    for (const key of ["loved", "hated", "wildestDetour", "lastWord"]) {
      const card = guide.fanRead[key];
      if (!card) continue;
      const cut = cuts.get(card.cutId);
      assert.ok(cut, `${record.id}:${key} cut must exist`);
      assertQuoteBoundToExcerpt(card.body, cut.excerpt, `${record.id}:${key}`);
      anchored += 1;
    }
  }
  assert.ok(anchored >= 500, `expected broad exact-source coverage, saw ${anchored}`);
});
