import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const engineSource = fs.readFileSync(
  path.join(root, "public", "demo", "source-dossier-engine.js"),
  "utf8",
);

function runtime() {
  const window = {};
  const sandbox = { window, globalThis: window };
  window.window = window;
  vm.createContext(sandbox);
  vm.runInContext(engineSource, sandbox, {
    filename: "source-dossier-engine.js",
  });
  return window.ShokkerSourceDossier;
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function receipt({
  key,
  at,
  label,
  entityIds,
  excerpt = "Car thirty three takes the lead at the stripe.",
}) {
  return {
    key,
    at,
    end: at + 20,
    kind: "race-moment",
    label,
    excerpt,
    evidenceLevel: "TIMESTAMPED CAPTION RECEIPT",
    evidenceType: "caption-excerpt",
    evidenceBasis: "official automatic caption event",
    reviewState: "machine-candidate",
    speaker: null,
    speakerStatus: "not-diarized",
    promotionAllowed: false,
    publicExcerptAllowed: true,
    entityIds,
  };
}

function source({
  id,
  title,
  date,
  coverage = "caption-backed",
  authority = "promoted-lane",
  receipts = [],
  entities = [],
  artifacts = [],
}) {
  return {
    id,
    title,
    displayTitle: title,
    date,
    duration: 4200,
    views: 1200,
    thumbnail: `https://i.ytimg.com/vi/${id}/maxresdefault.jpg`,
    url: `https://www.youtube.com/watch?v=${id}`,
    availability: "public-at-snapshot",
    liveStatus: "was-live",
    coverage,
    authority,
    lanes: ["race-broadcast"],
    sourceType: "race",
    wordsAudited: receipts.length ? 14000 : 0,
    summary: receipts.length
      ? {
          text: "A source-bounded race file with timed booth receipts.",
          basis: "caption-derived source summary",
        }
      : null,
    receipts,
    entities,
    artifacts,
    rightsPolicy: {
      speakerClaimsAllowed: false,
      rightsCleared: false,
    },
    warnings: ["Booth speakers are not diarized."],
    metrics: {},
  };
}

function fixture() {
  const firstReceipt = receipt({
    key: "RACEFILE01A:car33",
    at: 118,
    label: "CAR 33 LEAD CALL",
    entityIds: ["driver:car-33"],
  });
  const secondReceipt = receipt({
    key: "RACEFILE02B:car33",
    at: 3590,
    label: "CAR 33 FINISH CALL",
    entityIds: ["driver:car-33"],
    excerpt: "Car thirty three wins by one hundredth of a second.",
  });
  return {
    schema: "shokker-source-dossier-input/v1",
    channel: {
      id: "neutral-racing",
      label: "Neutral Racing Archive",
      packFingerprint: "cp1-0000000000000001",
    },
    snapshotDate: "2026-07-24",
    sources: [
      source({
        id: "RACEFILE01A",
        title: "Round One Race Broadcast",
        date: "2026-06-01",
        receipts: [firstReceipt],
        entities: [
          {
            id: "driver:car-33",
            label: "Car 33",
            type: "driver",
            basis: "timestamped-receipt",
            receiptKeys: [firstReceipt.key],
          },
        ],
        artifacts: [
          {
            id: "race-cut:car-33-season",
            kind: "supercut-draft",
            label: "CAR 33 SEASON CUT",
            authority: "creator-draft",
            reviewState: "human-review-required",
            sourceIds: ["RACEFILE01A", "RACEFILE02B"],
            receiptKeys: [firstReceipt.key, secondReceipt.key],
            at: 118,
            targetSection: "clip-lab",
            risk: "MEDIUM",
          },
        ],
      }),
      source({
        id: "RACEFILE02B",
        title: "Round Two Race Broadcast",
        date: "2026-07-01",
        receipts: [secondReceipt],
        entities: [
          {
            id: "driver:car-33",
            label: "Car 33",
            type: "driver",
            basis: "timestamped-receipt",
            receiptKeys: [secondReceipt.key],
          },
        ],
      }),
      source({
        id: "RACEFILE03C",
        title: "Car 33 Preview Show",
        date: "2026-07-10",
        coverage: "metadata-only",
        authority: "source-only",
        entities: [
          {
            id: "driver:car-33",
            label: "Car 33",
            type: "driver",
            basis: "cached-title-alias",
            receiptKeys: [],
          },
        ],
      }),
    ],
  };
}

function expectCode(code) {
  return (error) => {
    assert.equal(error?.name, "SourceDossierError");
    assert.equal(error?.code, code);
    return true;
  };
}

test("builds a deterministic channel-neutral dossier with typed dual-ended connections", () => {
  const api = runtime();
  const engine = api.create(fixture());
  const dossier = clone(engine.build("RACEFILE01A"));
  const again = clone(engine.build("RACEFILE01A"));

  assert.equal(engine.version, "1.0.0");
  assert.equal(engine.getStats().sources, 3);
  assert.equal(dossier.source.receipts.length, 1);
  assert.equal(dossier.wake.total, 2);
  assert.equal(dossier.wake.later[0].sourceId, "RACEFILE02B");
  assert.equal(dossier.wake.later[0].basis, "receipt-backed-entity");
  assert.deepEqual(
    dossier.wake.later[0].sharedEntities[0].localReceiptKeys,
    ["RACEFILE01A:car33"],
  );
  assert.deepEqual(
    dossier.wake.later[0].sharedEntities[0].relatedReceiptKeys,
    ["RACEFILE02B:car33"],
  );
  assert.equal(dossier.wake.later[1].sourceId, "RACEFILE03C");
  assert.equal(dossier.wake.later[1].basis, "source-metadata-neighbor");
  assert.equal(dossier.fingerprint, again.fingerprint);
  assert.deepEqual(dossier, again);
  assert.equal(Object.isFrozen(engine.build("RACEFILE01A")), true);
  assert.doesNotMatch(
    JSON.stringify(dossier),
    /WWAM|Halloween|Scream|Loomis|horror/i,
  );
});

test("exports exact coordinates and bindings without excerpts, captions, media, or speakers", () => {
  const manifest = clone(runtime().create(fixture()).exportManifest("RACEFILE01A"));
  const serialized = JSON.stringify(manifest);

  assert.equal(manifest.schema, "shokker-source-dossier-export/v1");
  assert.equal(manifest.source.id, "RACEFILE01A");
  assert.equal(manifest.receipts[0].at, 118);
  assert.equal(manifest.receipts[0].speaker, null);
  assert.doesNotMatch(serialized, /takes the lead|caption payload|thumbnail|embed/i);
  assert.deepEqual(manifest.omissions, [
    "transcript payloads",
    "caption excerpts",
    "generated summaries",
    "speaker fields beyond explicit null",
    "media",
  ]);
});

test("keeps source-only pages useful but claim-empty", () => {
  const dossier = clone(runtime().create(fixture()).build("RACEFILE03C"));

  assert.equal(dossier.proof.sourceOnly, true);
  assert.equal(dossier.source.summary, null);
  assert.deepEqual(dossier.source.receipts, []);
  assert.deepEqual(dossier.source.artifacts, []);
  assert.match(dossier.proof.evidenceBoundary, /No topic, quote, character/i);
  assert.ok(dossier.wake.earlier.length >= 1);
  assert.ok(dossier.wake.earlier.every((connection) => (
    connection.basis === "source-metadata-neighbor"
  )));
});

test("fails closed on coverage, speaker, excerpt, range, and artifact authority overreach", () => {
  const api = runtime();
  const metadataReceipt = fixture();
  metadataReceipt.sources[2].receipts = [
    receipt({
      key: "RACEFILE03C:fake",
      at: 20,
      label: "INVENTED CONTENT",
      entityIds: [],
    }),
  ];
  assert.throws(() => api.create(metadataReceipt), expectCode("COVERAGE_OVERREACH"));

  const speaker = fixture();
  speaker.sources[0].receipts[0].speaker = "Announcer";
  assert.throws(() => api.create(speaker), expectCode("SPEAKER_BOUNDARY"));

  const withheld = fixture();
  withheld.sources[0].receipts[0].publicExcerptAllowed = false;
  assert.throws(() => api.create(withheld), expectCode("WITHHELD_EXCERPT"));

  const outOfRange = fixture();
  outOfRange.sources[0].receipts[0].at = 5000;
  outOfRange.sources[0].receipts[0].end = 5020;
  assert.throws(() => api.create(outOfRange), expectCode("RECEIPT_OUT_OF_RANGE"));

  const authority = fixture();
  authority.sources[0].artifacts[0].authority = "auto-publish";
  assert.throws(() => api.create(authority), expectCode("ACTION_AUTHORITY"));
});

test("rejects foreign references, unsafe accessors, and prototype-sensitive input", () => {
  const api = runtime();
  const unknownSource = fixture();
  unknownSource.sources[0].artifacts[0].sourceIds.push("RACEFILE99Z");
  assert.throws(
    () => api.create(unknownSource),
    expectCode("UNKNOWN_ARTIFACT_SOURCE"),
  );

  const unknownReceipt = fixture();
  unknownReceipt.sources[0].artifacts[0].receiptKeys.push("missing-receipt");
  assert.throws(
    () => api.create(unknownReceipt),
    expectCode("UNKNOWN_ARTIFACT_RECEIPT"),
  );

  const accessor = fixture();
  Object.defineProperty(accessor.channel, "label", {
    enumerable: true,
    get() {
      throw new Error("attacker getter must not run");
    },
  });
  assert.throws(() => api.create(accessor), expectCode("UNSAFE_DESCRIPTOR"));

  const inherited = fixture();
  inherited.sources[0] = Object.assign(
    Object.create({ poisoned: true }),
    inherited.sources[0],
  );
  assert.throws(() => api.create(inherited), expectCode("UNSAFE_OBJECT"));
});
