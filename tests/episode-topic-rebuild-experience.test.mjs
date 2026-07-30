import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");
const BATCH_PATHS = [1, 2, 3, 4, 5].map((batch) =>
  path.join(
    ROOT,
    "public",
    "demo",
    `episode-guide-v2-topic-rebuild-batch${batch}.js`,
  )
);
const PRESENTER_PATH = path.join(
  ROOT,
  "public",
  "demo",
  "episode-topic-rebuild-experience.js",
);
const PUBLIC_VIEW_KEYS = [
  "schema",
  "kind",
  "sourceId",
  "sourceTitle",
  "date",
  "duration",
  "durationTimecode",
  "sourceUrl",
  "thumbnail",
  "format",
  "formatLabel",
  "eyebrow",
  "title",
  "description",
  "boundary",
  "stopCount",
  "lanes",
  "stops",
  "sourcePlayback",
];
const PUBLIC_STOP_KEYS = [
  "number",
  "id",
  "at",
  "end",
  "label",
  "topic",
  "summary",
  "excerpt",
  "classification",
  "visitorLane",
  "visitorLabel",
  "timecode",
  "endTimecode",
  "playback",
];
const LANE_MAP = {
  "topic-door": ["topic-format-door", "TOPIC / FORMAT DOOR"],
  "format-cue": ["topic-format-door", "TOPIC / FORMAT DOOR"],
  "evaluation-candidate": [
    "spoken-take-candidate",
    "ON-TAPE TAKE",
  ],
  "comedy-candidate": ["comedy-candidate", "COMEDY BEAT"],
};

function loadRuntime(options = {}) {
  const context = { window: {} };
  vm.createContext(context);
  if (options.withPayloads !== false) {
    BATCH_PATHS.forEach((file) => {
      vm.runInContext(fs.readFileSync(file, "utf8"), context, {
        filename: file,
      });
    });
  }
  vm.runInContext(fs.readFileSync(PRESENTER_PATH, "utf8"), context, {
    filename: PRESENTER_PATH,
  });
  return context.window;
}

function plain(value) {
  return JSON.parse(JSON.stringify(value));
}

function recursiveKeys(value, output = []) {
  if (!value || typeof value !== "object") return output;
  if (Array.isArray(value)) {
    value.forEach((item) => recursiveKeys(item, output));
    return output;
  }
  for (const [key, nested] of Object.entries(value)) {
    output.push(key);
    recursiveKeys(nested, output);
  }
  return output;
}

const runtime = loadRuntime();
const api = runtime.WWAM_EPISODE_TOPIC_REBUILD_EXPERIENCE;
const payloads = [1, 2, 3, 4, 5].map((batch) =>
  plain(runtime[`WWAM_EPISODE_GUIDE_V2_TOPIC_REBUILD_BATCH${batch}`])
);
const [batch1, batch2] = payloads;
const sourceGuides = payloads.flatMap((payload) => payload.guides);
const EXPECTED_IDS = sourceGuides.map((guide) => guide.id);
const sourceById = new Map(sourceGuides.map((guide) => [guide.id, guide]));
const pack = plain(api.buildAll(payloads));

test("attaches a standalone presenter with the required build contract", () => {
  assert.equal(runtime.WWAMEpisodeTopicRebuildExperience, api);
  assert.equal(api.VERSION, "1.2.0");
  assert.equal(api.schema, "wwam-episode-topic-rebuild-experience/v1");
  assert.deepEqual(Object.keys(api), [
    "VERSION",
    "schema",
    "build",
    "buildAll",
    "formatTime",
    "fromWindow",
  ]);

  const view = plain(api.build(payloads, "3Lu5KPrQhc8"));
  assert.ok(view);
  assert.equal(view.kind, "exact-source-stop-guide");
  assert.equal(view.sourceId, "3Lu5KPrQhc8");
  assert.equal(view.stopCount, 15);
  assert.equal(view.stops.length, 15);
  assert.deepEqual(Object.keys(view), PUBLIC_VIEW_KEYS);
  view.stops.forEach((stop) => {
    assert.deepEqual(Object.keys(stop), PUBLIC_STOP_KEYS);
  });
});

test("audits all 46 unique rebuilt sources and 690 exact-source stops", () => {
  assert.equal(pack.schema, "wwam-episode-topic-rebuild-experience/v1");
  assert.equal(pack.sourceCount, 46);
  assert.equal(pack.stopCount, 690);
  assert.equal(pack.experiences.length, 46);
  assert.deepEqual(
    pack.experiences.map((view) => view.sourceId),
    EXPECTED_IDS,
  );
  assert.equal(
    new Set(pack.experiences.map((view) => view.sourceId)).size,
    46,
  );
  for (const view of pack.experiences) {
    assert.equal(view.stopCount, 15, view.sourceId);
    assert.equal(view.stops.length, 15, view.sourceId);
    assert.equal(new Set(view.stops.map((stop) => stop.id)).size, 15);
  }
});

test("preserves all requested source fields and exact playback bounds", () => {
  for (const view of pack.experiences) {
    const source = sourceById.get(view.sourceId);
    assert.ok(source, view.sourceId);
    assert.equal(view.sourceTitle, source.title, view.sourceId);
    assert.equal(view.date, source.date, view.sourceId);
    assert.equal(view.duration, source.duration, view.sourceId);
    assert.equal(view.format, source.episodeGuide.format, view.sourceId);
    assert.equal(view.sourceUrl, source.url, view.sourceId);
    assert.equal(view.thumbnail, source.thumbnail, view.sourceId);

    view.stops.forEach((stop, index) => {
      const cut = source.episodeGuide.cuts[index];
      for (const key of [
        "id",
        "at",
        "end",
        "label",
        "topic",
        "summary",
        "excerpt",
        "classification",
      ]) {
        assert.equal(stop[key], cut[key], `${view.sourceId}:${cut.id}:${key}`);
      }
      assert.equal(stop.number, index + 1, stop.id);
      assert.deepEqual(
        stop.playback,
        {
          sourceId: view.sourceId,
          at: cut.at,
          end: cut.end,
          durationSeconds: cut.end - cut.at,
          timecode: plain(api.formatTime(cut.at)),
          endTimecode: plain(api.formatTime(cut.end)),
          url:
            "https://www.youtube.com/watch?v=" +
            encodeURIComponent(view.sourceId) +
            "&t=" +
            cut.at +
            "s",
        },
        stop.id,
      );
    });
  }
});

test("translates four internal classifications into three honest visitor lanes", () => {
  const totals = {
    "topic-format-door": 0,
    "spoken-take-candidate": 0,
    "comedy-candidate": 0,
  };
  for (const view of pack.experiences) {
    for (const stop of view.stops) {
      const expected = LANE_MAP[stop.classification];
      assert.ok(expected, stop.id);
      assert.equal(stop.visitorLane, expected[0], stop.id);
      assert.equal(stop.visitorLabel, expected[1], stop.id);
      totals[stop.visitorLane] += 1;
    }
    assert.deepEqual(
      view.lanes,
      [
        {
          id: "topic-format-door",
          label: "TOPIC / FORMAT DOOR",
          count: view.stops.filter(
            (stop) => stop.visitorLane === "topic-format-door",
          ).length,
        },
        {
          id: "spoken-take-candidate",
          label: "ON-TAPE TAKE",
          count: view.stops.filter(
            (stop) => stop.visitorLane === "spoken-take-candidate",
          ).length,
        },
        {
          id: "comedy-candidate",
          label: "COMEDY BEAT",
          count: view.stops.filter(
            (stop) => stop.visitorLane === "comedy-candidate",
          ).length,
        },
      ],
      view.sourceId,
    );
  }
  assert.deepEqual(totals, {
    "topic-format-door": 191,
    "spoken-take-candidate": 302,
    "comedy-candidate": 197,
  });
});

test("uses a clear playback-required context boundary on every view", () => {
  const expected =
    "These stops were located from the upload's captions. Play the clip to confirm who is speaking and see the full audio and visual context.";
  for (const view of pack.experiences) {
    assert.equal(view.boundary, expected, view.sourceId);
    assert.match(view.boundary, /play the clip/i, view.sourceId);
    assert.match(view.boundary, /confirm who is speaking/i, view.sourceId);
    assert.match(view.boundary, /audio and visual context/i, view.sourceId);
    assert.equal(view.title, "15 EXACT-SOURCE STOPS", view.sourceId);
    assert.doesNotMatch(
      `${view.title} ${view.description} ${view.boundary}`,
      /verified best moments?/i,
      view.sourceId,
    );
  }
});

test("exposes no hashes, rights machinery, review jargon, or hidden claims", () => {
  const serialized = JSON.stringify(pack);
  for (const forbidden of [
    "sha256",
    "provenance",
    "canonicalArtifact",
    "canonicalRecord",
    "inputEvidence",
    "rightsPolicy",
    "sourceState",
    "machine-surfaced",
    "quarantin",
    "reviewState",
    "reviewStatus",
    "humanEditorial",
    "promotionAllowed",
    "creatorApproval",
    "claimLane",
    "candidateType",
    "navigationOnly",
    "restrictedToTopicNavigation",
    "publicExcerptWordLimit",
  ]) {
    assert.doesNotMatch(serialized, new RegExp(forbidden, "i"), forbidden);
  }
  const keys = recursiveKeys(pack);
  assert.equal(
    keys.some((key) =>
      /^(?:evidence|speaker|speakerId|speakerName|performer|visualResult|originStatus|confidence)$/i.test(
        key,
      ),
    ),
    false,
  );
});

test("gives every source format a plain-language visitor label", () => {
  const formatById = Object.fromEntries(
    pack.experiences.map((view) => [view.sourceId, view.formatLabel]),
  );
  pack.experiences.forEach((view) => {
    assert.ok(view.formatLabel, view.sourceId);
    assert.doesNotMatch(view.formatLabel, /undefined|null/i, view.sourceId);
  });
  assert.deepEqual(
    Object.fromEntries(Object.entries(formatById).filter(([sourceId]) =>
      sourceGuides.slice(0, 10).some((guide) => guide.id === sourceId)
    )),
    {
    vjyNEQmgxC8: "SCARY-VIDEO WATCH PARTY",
    "Lllp-P-euww": "MOVIE COMMENTARY",
    nv99WEtXGvE: "DEATH-SCENE RANKING",
    uA5lTCjk7sQ: "TRAILER + NEWS LIVE SHOW",
    "5T1wWUjCGWk": "SCRIPT READING",
    "3Lu5KPrQhc8": "MOVIE COMMENTARY",
    rLdk9JKeN68: "TRAILER + NEWS LIVE SHOW",
    QxJyVaAgZ_Y: "MOVIE WATCH PARTY",
    bTzVQKD73L0: "SCARY-VIDEO WATCH PARTY",
    KIGg_I72x_M: "SCRIPT READING",
    },
  );
});

test("accepts common payload containers and supports window lookup", () => {
  const sourceId = "KIGg_I72x_M";
  const fromArray = plain(api.build(payloads, sourceId));
  assert.deepEqual(
    plain(api.build({ batches: payloads }, sourceId)),
    fromArray,
  );
  assert.deepEqual(
    plain(api.build({ batch1, batch2 }, sourceId)),
    fromArray,
  );
  assert.deepEqual(plain(api.fromWindow(sourceId)), fromArray);
  const batch5SourceId = payloads[4].guides[0].id;
  assert.deepEqual(
    plain(api.fromWindow(batch5SourceId)),
    plain(api.build(payloads, batch5SourceId)),
  );
  assert.equal(api.build(payloads, "not-a-source"), null);
  assert.equal(api.build(null, sourceId), null);
  assert.equal(api.build(payloads, ""), null);

  const emptyRuntime = loadRuntime({ withPayloads: false });
  assert.equal(
    emptyRuntime.WWAM_EPISODE_TOPIC_REBUILD_EXPERIENCE.fromWindow(sourceId),
    null,
  );
});

test("fails closed on duplicate sources or an incomplete 15-stop guide", () => {
  assert.throws(
    () => api.build([batch1, batch1], "vjyNEQmgxC8"),
    /duplicate source/i,
  );

  const incomplete = plain(batch1);
  incomplete.guides[0].episodeGuide.cuts.pop();
  assert.throws(
    () => api.build(incomplete, incomplete.guides[0].id),
    /exactly 15 source stops/i,
  );
});

test("returns deterministic visitor views", () => {
  const first = plain(api.buildAll(payloads));
  const second = plain(api.buildAll(payloads));
  assert.deepEqual(first, pack);
  assert.deepEqual(second, pack);
  assert.deepEqual(first, second);
  for (const sourceId of EXPECTED_IDS) {
    assert.deepEqual(
      plain(api.build(payloads, sourceId)),
      pack.experiences.find((view) => view.sourceId === sourceId),
      sourceId,
    );
  }
});
