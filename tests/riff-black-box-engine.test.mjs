import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const demo = path.resolve(here, "../public/demo");
const files = [
  "catalog.js",
  "deep-distill.js",
  "livestream-distill.js",
  "popular-live-distill.js",
  "character-lore.js",
  "wwam-channel-dna.js",
  "showcase-engine.js",
  "riff-black-box-engine.js",
];

function load() {
  const context = { window: {} };
  context.globalThis = context.window;
  vm.createContext(context);
  files.forEach((file) => {
    vm.runInContext(fs.readFileSync(path.join(demo, file), "utf8"), context, {
      filename: file,
    });
  });
  return context.window;
}

function build(window, packFingerprint = "fixture:wwam-promoted-pack") {
  const showcase = window.WWAMShowcaseEngine.create({
    catalog: window.WWAM_CATALOG,
    deep: window.WWAM_DEEP_DISTILL,
    live: window.WWAM_LIVESTREAMS,
    popular: window.WWAM_POPULAR_LIVE,
    characters: window.WWAM_CHARACTER_LORE,
    dna: window.WWAM_CHANNEL_DNA,
  });
  const engine = window.ShokkerRiffBlackBoxEngine.create({
    showcase,
    packFingerprint,
  });
  return { showcase, engine };
}

function plain(value) {
  return JSON.parse(JSON.stringify(value));
}

function stableValue(value) {
  if (Array.isArray(value)) return value.map(stableValue);
  if (value && typeof value === "object") {
    return Object.keys(value).sort().reduce((output, key) => {
      output[key] = stableValue(value[key]);
      return output;
    }, {});
  }
  return value;
}

function fnv1a32(value) {
  let hash = 2166136261;
  for (const byte of Buffer.from(value, "utf8")) {
    hash ^= byte;
    hash = Math.imul(hash, 16777619);
  }
  return `fnv1a32:${(`00000000${(hash >>> 0).toString(16)}`).slice(-8)}`;
}

function reFingerprint(packet) {
  const copy = plain(packet);
  delete copy.fingerprint;
  packet.fingerprint = fnv1a32(JSON.stringify(stableValue(copy)));
  return packet;
}

function collectForbiddenKeys(value, output = []) {
  if (Array.isArray(value)) {
    value.forEach((entry) => collectForbiddenKeys(entry, output));
    return output;
  }
  if (!value || typeof value !== "object") return output;
  Object.entries(value).forEach(([key, entry]) => {
    if (/^(transcript|transcripts|caption|captions|events|fullEvents|rawEvents)$/i.test(key)) {
      output.push(key);
    }
    collectForbiddenKeys(entry, output);
  });
  return output;
}

function collectExcerpts(value, output = []) {
  if (Array.isArray(value)) {
    value.forEach((entry) => collectExcerpts(entry, output));
    return output;
  }
  if (!value || typeof value !== "object") return output;
  Object.entries(value).forEach(([key, entry]) => {
    if (/^(excerpt|quote)$/i.test(key)) output.push(String(entry || ""));
    collectExcerpts(entry, output);
  });
  return output;
}

function neutralShowcase() {
  const weights = {
    heat: 0.28,
    escalation: 0.2,
    callbackDensity: 0.16,
    derailment: 0.16,
    roomBreak: 0.14,
    topicCollision: 0.06,
  };
  const sources = [
    {
      id: "racevid0001",
      title: "Wednesday Feature at Sample Speedway",
      type: "feature-race",
      date: "2026-07-22",
      duration: 600,
    },
    {
      id: "racevid0002",
      title: "Wednesday Feature at Test Circuit",
      type: "feature-race",
      date: "2026-07-15",
      duration: 600,
    },
  ];
  const receipts = [
    {
      id: "race:opening",
      sourceId: "racevid0001",
      t: 5,
      category: "GREEN FLAG",
      excerpt: "The field takes the green flag two wide.",
      score: 50,
      type: "moment",
      evidenceLevel: "machine",
      entityIds: [],
    },
    {
      id: "race:lead-change",
      sourceId: "racevid0001",
      t: 10,
      category: "LEAD CHANGE",
      excerpt: "Car seven clears by inches at the stripe.",
      score: 50,
      type: "moment",
      evidenceLevel: "machine",
      entityIds: ["topic:lead-change"],
    },
    {
      id: "race:finish",
      sourceId: "racevid0002",
      t: 590,
      category: "PHOTO FINISH",
      excerpt: "The booth is laughing as both cars reach the line together.",
      score: 80,
      type: "moment",
      evidenceLevel: "machine",
      entityIds: ["franchise:sample-series", "topic:photo-finish"],
    },
  ];
  const moments = [
    {
      receiptId: "race:lead-change",
      sourceId: "racevid0001",
      t: 10,
      category: "LEAD CHANGE",
      score: 50,
      label: "SIDE BY SIDE",
      dimensions: {
        heat: 50,
        escalation: 50,
        callbackDensity: 50,
        derailment: 50,
        roomBreak: 50,
        topicCollision: 50,
      },
      basis: {
        sourceHeat: 50,
        matchedBits: 0,
        indexedSubjects: 1,
        category: "LEAD CHANGE",
      },
    },
    {
      receiptId: "race:finish",
      sourceId: "racevid0002",
      t: 590,
      category: "PHOTO FINISH",
      score: 80,
      label: "CHECKERED FLAG",
      dimensions: {
        heat: 80,
        escalation: 80,
        callbackDensity: 80,
        derailment: 80,
        roomBreak: 80,
        topicCollision: 80,
      },
      basis: {
        sourceHeat: 80,
        matchedBits: 0,
        indexedSubjects: 2,
        category: "PHOTO FINISH",
      },
    },
  ];
  return {
    inputFingerprint: "neutral-racing-ledger",
    sources,
    receipts,
    getRiffChemistry() {
      return {
        formula:
          "28% source heat + 20% escalation + 16% callback density + 16% derailment + 14% room break + 6% topic collision",
        moments,
        weights,
      };
    },
  };
}

test("Riff Black Box exposes a generic deterministic engine contract", () => {
  const window = load();
  const { engine } = build(window);

  assert.equal(window.ShokkerRiffBlackBoxEngine.VERSION, "1.0.0");
  assert.equal(
    window.ShokkerRiffBlackBoxEngine.SCHEMA,
    "shokker-youtube-wiki/riff-black-box/v1",
  );
  assert.deepEqual(
    plain(window.ShokkerRiffBlackBoxEngine.DIMENSION_IDS),
    [
      "heat",
      "escalation",
      "callbackDensity",
      "derailment",
      "roomBreak",
      "topicCollision",
    ],
  );
  [
    "list",
    "inspect",
    "snapshot",
    "verify",
    "restore",
    "serialize",
    "inspectionPacket",
    "verifyInspection",
    "serializeInspection",
  ].forEach((method) => {
    assert.equal(typeof engine[method], "function", method);
  });
  assert.equal(Object.isFrozen(engine), true);
});

test("the full promoted portfolio reconciles 306 anchors across 69 sources with zero score drift", () => {
  const window = load();
  const { showcase, engine } = build(window);
  const chemistry = showcase.getRiffChemistry();
  const anchors = engine.list();
  const promotedReceiptIds = new Set(showcase.receipts.map((receipt) => receipt.id));

  assert.equal(chemistry.moments.length, 306);
  assert.equal(engine.metrics.anchorCount, 306);
  assert.equal(engine.metrics.sourceCount, 69);
  assert.equal(engine.metrics.dimensionCount, 6);
  assert.equal(engine.metrics.scoreDriftCount, 0);
  assert.equal(engine.metrics.maximumScoreDrift, 0);
  assert.equal(engine.metrics.weightTotal, 1);
  assert.equal(anchors.length, 306);
  assert.equal(new Set(anchors.map((anchor) => anchor.sourceId)).size, 69);
  assert.deepEqual(plain(engine.weights), {
    heat: 0.28,
    escalation: 0.2,
    callbackDensity: 0.16,
    derailment: 0.16,
    roomBreak: 0.14,
    topicCollision: 0.06,
  });

  anchors.forEach((anchor) => {
    assert.equal(promotedReceiptIds.has(anchor.receiptId), true, anchor.receiptId);
    assert.deepEqual(Object.keys(anchor.dimensions).sort(), [
      "callbackDensity",
      "derailment",
      "escalation",
      "heat",
      "roomBreak",
      "topicCollision",
    ]);
    const recomputed = Math.round(
      Object.keys(engine.weights).reduce(
        (sum, key) => sum + anchor.dimensions[key] * engine.weights[key],
        0,
      ),
    );
    assert.equal(anchor.score, recomputed, anchor.receiptId);
    assert.equal(anchor.recomputedScore, recomputed, anchor.receiptId);
    assert.equal(anchor.scoreDrift, 0, anchor.receiptId);
    assert.equal(anchor.speaker, null, anchor.receiptId);
  });
});

test("a R_bXrnNOcwg autopsy supplies exact bounded coordinates and non-causal neighbors", () => {
  const window = load();
  const { engine } = build(window);
  const inspection = engine.inspect(
    "R_bXrnNOcwg:moment:3810:the-room-breaks:2",
  );

  assert.equal(inspection.anchor.sourceId, "R_bXrnNOcwg");
  assert.equal(inspection.anchor.t, 3810);
  assert.equal(inspection.anchor.score, 71);
  assert.equal(inspection.recomputedScore, 71);
  assert.equal(inspection.scoreDrift, 0);
  assert.deepEqual(plain(inspection.dimensions), {
    heat: 94,
    escalation: 86,
    callbackDensity: 0,
    derailment: 94,
    roomBreak: 90,
    topicCollision: 0,
  });
  assert.equal(inspection.contextWindow.start, 3795);
  assert.equal(inspection.contextWindow.end, 3830);
  assert.equal(
    inspection.contextWindow.startUrl,
    "https://www.youtube.com/watch?v=R_bXrnNOcwg&t=3795s",
  );
  assert.equal(
    inspection.contextWindow.endUrl,
    "https://www.youtube.com/watch?v=R_bXrnNOcwg&t=3830s",
  );
  assert.equal(inspection.contextWindow.dialogueReconstructed, false);
  assert.equal(inspection.contextWindow.excerptSupplied, false);
  assert.equal(
    inspection.neighbors.before.receiptId,
    "R_bXrnNOcwg:moment:3634:the-room-breaks:1",
  );
  assert.equal(inspection.neighbors.before.deltaSeconds, 176);
  assert.equal(
    inspection.neighbors.after.receiptId,
    "R_bXrnNOcwg:moment:4292:the-room-breaks:3",
  );
  assert.equal(inspection.neighbors.after.deltaSeconds, 482);
  assert.equal(inspection.neighbors.before.navigationOnly, true);
  assert.match(inspection.neighbors.disclaimer, /not evidence of a causal setup or payoff/i);
  assert.match(inspection.disclaimer, /do not establish setup, payoff, intent, or causality/i);
  assert.equal(inspection.speaker, null);
  assert.equal(inspection.reactionCue.status, "unknown");
  assert.equal(inspection.reactionCue.label, "UNKNOWN");
});

test("reaction evidence is literal-only even when a category sounds like a room reaction", () => {
  const window = load();
  const { showcase, engine } = build(window);
  const receiptById = new Map(showcase.receipts.map((receipt) => [receipt.id, receipt]));
  const anchors = engine.list();

  assert.equal(engine.metrics.literalReactionCueCount, 13);
  assert.equal(engine.metrics.unknownReactionCount, 293);
  anchors.forEach((anchor) => {
    const literal = receiptById.get(anchor.receiptId).excerpt;
    const allowed = literal.match(/\b(?:laughter|laughing)\b|can['\u2019]t breathe/i);
    if (allowed) {
      assert.equal(anchor.reactionCue.status, "literal-excerpt-cue", anchor.receiptId);
      assert.equal(anchor.reactionCue.literal.toLowerCase(), allowed[0].toLowerCase());
    } else {
      assert.equal(anchor.reactionCue.status, "unknown", anchor.receiptId);
      assert.equal(anchor.reactionCue.literal, null, anchor.receiptId);
    }
  });

  const literalInspection = engine.inspect(
    "R_bXrnNOcwg:moment:3634:the-room-breaks:1",
  );
  assert.equal(literalInspection.reactionCue.status, "literal-excerpt-cue");
  assert.equal(literalInspection.reactionCue.literal.toLowerCase(), "laughter");

  const unknownInspection = engine.inspect(
    "R_bXrnNOcwg:moment:4292:the-room-breaks:3",
  );
  assert.equal(unknownInspection.anchor.category, "THE ROOM BREAKS");
  assert.equal(unknownInspection.reactionCue.status, "unknown");
});

test("every public playback coordinate is official and inside its promoted source", () => {
  const window = load();
  const { showcase, engine } = build(window);
  const durationBySource = new Map(
    showcase.sources.map((source) => [source.id, source.duration]),
  );

  engine.list().forEach((anchor) => {
    assert.match(
      anchor.url,
      new RegExp(
        `^https://www\\.youtube\\.com/watch\\?v=${anchor.sourceId}&t=${anchor.t}s$`,
      ),
    );
    assert.ok(anchor.t >= 0);
    assert.ok(anchor.t <= durationBySource.get(anchor.sourceId));
    const inspection = engine.inspect(anchor.receiptId);
    assert.ok(inspection.contextWindow.start >= 0);
    assert.ok(
      inspection.contextWindow.end <= durationBySource.get(anchor.sourceId),
      anchor.receiptId,
    );
    [inspection.neighbors.before, inspection.neighbors.after]
      .filter(Boolean)
      .forEach((neighbor) => {
        assert.equal(neighbor.sourceId, anchor.sourceId);
        assert.ok(neighbor.deltaSeconds <= 900);
        assert.match(
          neighbor.url,
          /^https:\/\/www\.youtube\.com\/watch\?v=[A-Za-z0-9_-]{11}&t=\d+s$/,
        );
      });
  });
  assert.equal(engine.inspect("not-in-the-promoted-ledger"), null);
});

test("snapshots are deterministic, bounded, and fail closed on tampering or a foreign pack", () => {
  const window = load();
  const first = build(window, "pack:first").engine;
  const second = build(window, "pack:first").engine;
  const foreign = build(window, "pack:foreign").engine;
  const snapshot = first.snapshot();

  assert.deepEqual(plain(snapshot), plain(second.snapshot()));
  assert.equal(first.verify(snapshot).ok, true);
  assert.deepEqual(plain(first.restore(snapshot)), plain(snapshot));
  assert.equal(first.serialize(snapshot), second.serialize(second.snapshot()));
  assert.equal(collectForbiddenKeys(snapshot).length, 0);
  collectExcerpts(snapshot).forEach((excerpt) => {
    assert.ok(excerpt.split(/\s+/).filter(Boolean).length <= 16, excerpt);
  });
  const serialized = first.serialize();
  assert.doesNotMatch(serialized, /"(?:transcript|transcripts|caption|captions|events|fullEvents)"\s*:/i);
  assert.doesNotMatch(serialized, /R_bXrnNOcwg:topic:225:chat-superchats:2/);

  const tampered = plain(snapshot);
  tampered.anchors[0].score += 1;
  assert.equal(first.verify(tampered).ok, false);
  assert.throws(() => first.restore(tampered), (error) => error.code === "SNAPSHOT_INVALID");
  assert.throws(() => first.serialize(tampered), (error) => error.code === "SNAPSHOT_INVALID");

  const rehashedTamper = reFingerprint(plain(snapshot));
  rehashedTamper.anchors[0].literalBasis.matchedBits += 1;
  reFingerprint(rehashedTamper);
  const rehashedReport = first.verify(rehashedTamper);
  assert.equal(rehashedReport.ok, false);
  assert.match(rehashedReport.errors.join(" "), /does not match the deterministic promoted ledger/i);

  const foreignReport = foreign.verify(snapshot);
  assert.equal(foreignReport.ok, false);
  assert.match(foreignReport.errors.join(" "), /foreign channel-pack fingerprint/i);
});

test("score, dimension, coordinate, and ledger drift are rejected during construction", () => {
  const window = load();
  const { showcase } = build(window);
  const chemistry = plain(showcase.getRiffChemistry());
  const create = (mutate) => {
    const changed = plain(chemistry);
    mutate(changed);
    return window.ShokkerRiffBlackBoxEngine.create({
      showcase: {
        inputFingerprint: showcase.inputFingerprint,
        sources: showcase.sources,
        receipts: showcase.receipts,
        getRiffChemistry() {
          return changed;
        },
      },
      packFingerprint: "drift-test",
    });
  };

  assert.throws(
    () => create((changed) => {
      changed.moments[0].score += 1;
    }),
    (error) => error.code === "CHEMISTRY_SCORE_DRIFT",
  );
  assert.throws(
    () => create((changed) => {
      delete changed.moments[0].dimensions.roomBreak;
    }),
    (error) => error.code === "CHEMISTRY_DIMENSION_SET",
  );
  assert.throws(
    () => create((changed) => {
      changed.moments[0].t += 1;
    }),
    (error) => error.code === "CHEMISTRY_COORDINATE_DRIFT",
  );
  assert.throws(
    () => create((changed) => {
      changed.moments[0].receiptId = "foreign:receipt";
    }),
    (error) => error.code === "CHEMISTRY_RECEIPT_FOREIGN",
  );
});

test("a selected autopsy exports as a small independently verified receipt packet", () => {
  const window = load();
  const { engine } = build(window);
  const receiptId = "R_bXrnNOcwg:moment:3810:the-room-breaks:2";
  const packet = engine.inspectionPacket(receiptId);

  assert.equal(
    packet.schema,
    "shokker-youtube-wiki/riff-black-box/v1/inspection-packet",
  );
  assert.equal(packet.inspection.anchor.receiptId, receiptId);
  assert.equal(packet.inspection.anchor.t, 3810);
  assert.equal(packet.binding.evidenceFingerprint, engine.binding.evidenceFingerprint);
  assert.equal(engine.verifyInspection(packet).ok, true);
  assert.equal(
    engine.serializeInspection(packet),
    engine.serializeInspection(receiptId),
  );
  assert.ok(
    Buffer.byteLength(engine.serializeInspection(packet), "utf8") < 20_000,
  );
  assert.ok(
    Buffer.byteLength(engine.serializeInspection(packet), "utf8") <
      Buffer.byteLength(engine.serialize(), "utf8") / 20,
  );
  assert.equal(engine.inspectionPacket("not-in-ledger"), null);
  assert.equal(engine.verifyInspection(null).ok, false);
  assert.throws(
    () => engine.serializeInspection("not-in-ledger"),
    (error) => error.code === "INSPECTION_PACKET_INVALID",
  );

  const tampered = reFingerprint(plain(packet));
  tampered.inspection.anchor.score += 1;
  reFingerprint(tampered);
  const report = engine.verifyInspection(tampered);
  assert.equal(report.ok, false);
  assert.match(
    report.errors.join(" "),
    /does not match the deterministic promoted receipt/i,
  );
});

test("a neutral racing fixture gets its own vocabulary, bounded coordinates, and no WWAM or horror leakage", () => {
  const window = load();
  const engine = window.ShokkerRiffBlackBoxEngine.create({
    showcase: neutralShowcase(),
    packFingerprint: "fixture:neutral-racing",
    labels: {
      productName: "Race Replay Black Box",
      anchorName: "Timing anchor",
      contextName: "Replay window",
      literalReaction: "LITERAL BOOTH REACTION",
      unknownReaction: "NOT ON THE TIMING SHEET",
      dimensions: {
        heat: "Race pressure",
        escalation: "Closing rate",
        callbackDensity: "Prior-race callbacks",
        derailment: "Race disruption",
        roomBreak: "Booth reaction",
        topicCollision: "Storyline collision",
      },
    },
  });

  assert.equal(engine.metrics.anchorCount, 2);
  assert.equal(engine.metrics.sourceCount, 2);
  assert.equal(engine.metrics.scoreDriftCount, 0);
  assert.equal(engine.labels.productName, "Race Replay Black Box");
  const opening = engine.inspect("race:lead-change");
  assert.equal(opening.contextWindow.start, 0);
  assert.equal(opening.contextWindow.end, 30);
  assert.equal(opening.neighbors.before.receiptId, "race:opening");
  assert.equal(opening.neighbors.after, null);
  assert.equal(opening.reactionCue.label, "NOT ON THE TIMING SHEET");
  const finish = engine.inspect("race:finish");
  assert.equal(finish.contextWindow.start, 575);
  assert.equal(finish.contextWindow.end, 600);
  assert.equal(finish.reactionCue.label, "LITERAL BOOTH REACTION");
  assert.equal(finish.reactionCue.literal.toLowerCase(), "laughing");

  const publicArtifact = JSON.stringify({
    labels: engine.labels,
    dimensions: engine.dimensions,
    snapshot: engine.snapshot(),
    opening,
    finish,
  });
  assert.doesNotMatch(
    publicArtifact,
    /\b(?:wwam|halloween|loomis|challis|slenderman|feldman|horror|midnight|movie commentary)\b/i,
  );
});
