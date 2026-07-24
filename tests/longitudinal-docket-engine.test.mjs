import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import vm from "node:vm";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import {
  NEUTRAL_RACING_ADAPTER,
  NEUTRAL_RACING_DNA,
} from "./fixtures/channel-pack-neutral-racing.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(here, "..");
const demo = path.join(root, "public", "demo");
const dataPath = path.join(demo, "longitudinal-docket-data.js");
const enginePath = path.join(demo, "longitudinal-docket-engine.js");

function load(files = [
  "wwam-channel-dna.js",
  "wwam-channel-pack-adapter.js",
  "channel-pack-contract.js",
  "longitudinal-docket-data.js",
  "longitudinal-docket-engine.js",
]) {
  const context = { window: {} };
  context.globalThis = context.window;
  vm.createContext(context);
  for (const file of files) {
    vm.runInContext(fs.readFileSync(path.join(demo, file), "utf8"), context, {
      filename: file,
    });
  }
  return context.window;
}

function plain(value) {
  return JSON.parse(JSON.stringify(value));
}

function clone(value) {
  return structuredClone(plain(value));
}

function compareText(left, right) {
  return left < right ? -1 : (left > right ? 1 : 0);
}

function semantic(value) {
  if (Array.isArray(value)) {
    const output = value.map(semantic);
    if (output.every((entry) => typeof entry === "string")) {
      return output.slice().sort(compareText);
    }
    if (
      output.length > 0 &&
      output.every((entry) => (
        entry &&
        typeof entry === "object" &&
        !Array.isArray(entry) &&
        typeof entry.id === "string"
      ))
    ) {
      return output.slice().sort((left, right) => compareText(left.id, right.id));
    }
    if (
      output.length > 0 &&
      output.every((entry) => (
        entry &&
        typeof entry === "object" &&
        !Array.isArray(entry) &&
        typeof entry.subjectId === "string"
      ))
    ) {
      return output.slice().sort((left, right) => (
        compareText(left.subjectId, right.subjectId) ||
        compareText(left.basis || "", right.basis || "") ||
        compareText(left.cue || "", right.cue || "")
      ));
    }
    return output;
  }
  if (value && typeof value === "object") {
    return Object.keys(value).sort(compareText).reduce((output, key) => {
      output[key] = semantic(value[key]);
      return output;
    }, Object.create(null));
  }
  return value;
}

function stableJson(value) {
  return JSON.stringify(semantic(value));
}

function fnv1a32(value) {
  let current = 0x811c9dc5;
  for (const byte of Buffer.from(value, "utf8")) {
    current ^= byte;
    current = Math.imul(current, 0x01000193) >>> 0;
  }
  return `fnv1a32:${current.toString(16).padStart(8, "0")}`;
}

function artifactFingerprint(data) {
  const copy = clone(data);
  delete copy.fingerprints.publicFnv1a;
  return fnv1a32(stableJson(copy));
}

function packetFingerprint(packet) {
  const copy = clone(packet);
  delete copy.fingerprint;
  return fnv1a32(stableJson(copy));
}

function refingerprint(data) {
  data.fingerprints.publicFnv1a = artifactFingerprint(data);
  return data;
}

function actualFixture() {
  const window = load();
  const channelPack = window.ShokkerChannelPack.compile(
    window.WWAM_CHANNEL_DNA,
    window.WWAM_CHANNEL_PACK_ADAPTER,
  );
  const data = plain(window.WWAM_LONGITUDINAL_DOCKETS);
  const engine = window.ShokkerLongitudinalDocket.create({
    channelPack,
    data,
  });
  return { window, channelPack, data, engine };
}

function neutralPack(window, adapter = clone(NEUTRAL_RACING_ADAPTER)) {
  return window.ShokkerChannelPack.compile(
    clone(NEUTRAL_RACING_DNA),
    adapter,
  );
}

function neutralData(channelPack) {
  const data = {
    schema: "shokker-youtube-wiki/longitudinal-docket-data/v1",
    schemaVersion: "1.0.0",
    generated: "2026-07-24",
    snapshotDate: "2026-07-24",
    channel: {
      id: channelPack.identity.id,
      label: channelPack.identity.channel,
      packFingerprint: channelPack.fingerprint,
      platform: "youtube",
      canonicalUrl: "https://www.youtube.com/@FictionalRaceArchive",
    },
    labels: {
      product: "THE REPLAY REMEMBERS",
      forecast: "BEFORE THE GREEN",
      response: "AFTER THE FLAG",
      unresolved: "UNDER STEWARD REVIEW",
      editBrief: "BEFORE / AFTER REPLAY BRIEF",
    },
    policy: {
      machineOutputState: "quarantine",
      machinePairRelationship: "MAY_RESOLVE",
      verdictAuthority: "authenticated-human-review-required",
      promotionRequiresHumanReview: true,
      preserveContradictions: true,
      publicExcerptWords: 16,
      timestampRequired: true,
      sourceUrlRequired: true,
      noSpeakerGuessing: true,
      trailerAudioBoundaryRule: "topic-navigation-only",
      visualOutcomeRule: "unresolved-until-whole-work-review",
      exportRule: "bounded-public-evidence-only",
    },
    provenance: {
      generator: "offline-bounded-evidence-pipeline",
      networkUsed: false,
      privateInput: "local-caption-cache",
      publicInput: "bounded-source-metadata-and-caption-excerpts",
      fullCaptionPayloadPublic: false,
      integrityNote: "change-detector-only",
    },
    subjects: [
      { id: "event:round-4", label: "Round 4", type: "event" },
      { id: "participant:car-33", label: "Car 33", type: "participant" },
    ],
    sources: [
      {
        id: "abcRACE1234",
        title: "Round 4 Preview",
        date: "2026-07-15",
        durationSeconds: 1800,
        url: "https://www.youtube.com/watch?v=abcRACE1234",
        lane: "feature-race",
        contentMode: "race-broadcast",
        rightsMode: "standard-caption-candidates",
        evidenceAccess: "short-caption-candidate",
        captionTrack: "youtube-automatic-caption",
        captionPayloadSha256: `sha256:${"a".repeat(64)}`,
        speakerDiarized: false,
        originAttribution: false,
        visualContextVerified: false,
        promotionAllowed: false,
      },
      {
        id: "xyzRACE5678",
        title: "Round 4 Feature",
        date: "2026-07-22",
        durationSeconds: 3600,
        url: "https://www.youtube.com/watch?v=xyzRACE5678",
        lane: "feature-race",
        contentMode: "race-broadcast",
        rightsMode: "standard-caption-candidates",
        evidenceAccess: "short-caption-candidate",
        captionTrack: "youtube-automatic-caption",
        captionPayloadSha256: `sha256:${"b".repeat(64)}`,
        speakerDiarized: false,
        originAttribution: false,
        visualContextVerified: false,
        promotionAllowed: false,
      },
    ],
    claims: [
      {
        id: "claim:car-33-win",
        sourceId: "abcRACE1234",
        role: "forecast",
        t: 500,
        url: "https://www.youtube.com/watch?v=abcRACE1234&t=500s",
        window: { from: 494, to: 510 },
        excerpt: "Car 33 will win after the final stop",
        excerptMode: "normalized-automatic-caption-sequence",
        subjects: ["event:round-4", "participant:car-33"],
        subjectBindings: [
          {
            subjectId: "event:round-4",
            basis: "source-title",
            cue: "Round 4",
          },
          {
            subjectId: "participant:car-33",
            basis: "excerpt",
            cue: "Car 33",
          },
        ],
        cueType: "explicit-forecast-language",
        cueTerms: ["will win"],
        additionalReceipts: [],
        speaker: null,
        originStatus: "not-inferred",
        reviewStatus: "machine-candidate",
        promotionAllowed: false,
        visualContextVerified: false,
      },
    ],
    responses: [
      {
        id: "response:car-33-line",
        sourceId: "xyzRACE5678",
        role: "response",
        t: 2400,
        url: "https://www.youtube.com/watch?v=xyzRACE5678&t=2400s",
        window: { from: 2394, to: 2410 },
        excerpt: "Car 33 crossed the line first",
        excerptMode: "normalized-automatic-caption-sequence",
        subjects: ["event:round-4", "participant:car-33"],
        subjectBindings: [
          {
            subjectId: "event:round-4",
            basis: "source-title",
            cue: "Round 4",
          },
          {
            subjectId: "participant:car-33",
            basis: "excerpt",
            cue: "Car 33",
          },
        ],
        cueType: "retrospective-response-language",
        cueTerms: ["crossed the line first"],
        additionalReceipts: [],
        speaker: null,
        originStatus: "not-inferred",
        reviewStatus: "machine-candidate",
        promotionAllowed: false,
        visualContextVerified: false,
      },
    ],
    dockets: [
      {
        id: "docket:car-33-round-4",
        title: "Round 4 // BEFORE THE GREEN → AFTER THE FLAG",
        claimId: "claim:car-33-win",
        responseId: "response:car-33-line",
        subjects: ["event:round-4", "participant:car-33"],
        relationship: "MAY_RESOLVE",
        pairSignal: "MAY_SUPPORT",
        pairBasis: [
          "chronological-distinct-sources",
          "no-speaker-continuity-claim",
          "role-cues-present",
          "shared-subjects",
        ],
        chronology: {
          forecastDate: "2026-07-15",
          responseDate: "2026-07-22",
          daysBetween: 7,
        },
        verdict: null,
        resolutionStatus: "unresolved",
        reviewStatus: "machine-paired-unreviewed",
        resolutionBlockedBy: [
          "authenticated-human-review-required",
          "outcome-not-independently-verified",
          "speaker-not-diarized",
        ],
        requiresOutcomeVerification: true,
        requiresWholeWorkVisualReview: false,
        visualOutcomeVerified: false,
        speaker: null,
        promotionAllowed: false,
      },
    ],
    fingerprints: {
      captionSetSha256:
        "sha256:33167de1ef7c9ac1aa3726a8ea834f230bdc5594dcec754fe1dcee19e7e1097d",
      publicFnv1a: "fnv1a32:00000000",
    },
  };
  return refingerprint(data);
}

function issueCodes(error) {
  return new Set((error && error.issues || []).map((entry) => entry.code));
}

function assertRejected(window, channelPack, data, expectedCode) {
  assert.throws(
    () => window.ShokkerLongitudinalDocket.create({
      channelPack,
      data: refingerprint(data),
    }),
    (error) => (
      error.code === "LONGITUDINAL_DOCKET_REJECTED" &&
      issueCodes(error).has(expectedCode)
    ),
  );
}

function everyValue(value, predicate) {
  if (Array.isArray(value)) {
    return value.every((entry) => everyValue(entry, predicate));
  }
  if (value && typeof value === "object") {
    return Object.entries(value).every(([key, child]) => (
      predicate(key, child) &&
      everyValue(child, predicate)
    ));
  }
  return true;
}

test("freezes four honest WWAM launch cases under one exact ChannelPack", () => {
  const { window, channelPack, data, engine } = actualFixture();
  const list = plain(engine.list());
  const verify = plain(engine.verify());

  assert.equal(window.ShokkerLongitudinalDocket.VERSION, "1.0.0");
  assert.equal(
    window.ShokkerLongitudinalDocket.DATA_SCHEMA,
    "shokker-youtube-wiki/longitudinal-docket-data/v1",
  );
  assert.equal(channelPack.fingerprint, "cp1-dd23bc386008689b");
  assert.ok(channelPack.capabilities.includes("longitudinal-claim-ledger"));
  assert.equal(data.channel.packFingerprint, channelPack.fingerprint);
  assert.equal(data.labels.product, "THE TAPE KEEPS SCORE");
  assert.equal(data.dockets.length, 4);
  assert.equal(data.sources.length, 8);
  assert.equal(data.claims.length, 4);
  assert.equal(data.responses.length, 4);
  assert.deepEqual(
    list.map((record) => [record.id, record.pairSignal]),
    [
      ["docket:anger-forecast-to-death-talk", "OPEN"],
      [
        "docket:halloween-ends-excitement-to-mixed-reaction",
        "MAY_BE_MIXED",
      ],
      ["docket:scream-7-commentary-plan-open", "OPEN"],
      ["docket:scream-vi-anticipation-to-reception", "MAY_SUPPORT"],
    ],
  );
  assert.ok(list.every((record) => (
    record.relationship === "MAY_RESOLVE" &&
    record.verdict === null &&
    record.resolutionStatus === "unresolved" &&
    record.reviewStatus === "machine-paired-unreviewed" &&
    record.visualOutcomeVerified === false &&
    record.speaker === null &&
    record.promotionAllowed === false
  )));
  assert.deepEqual(verify, {
    ok: true,
    kind: "data-artifact",
    schema: "shokker-youtube-wiki/longitudinal-docket-data/v1",
    expected: "fnv1a32:59b085f6",
    actual: "fnv1a32:59b085f6",
    errors: [],
    changeDetectorOnly: true,
  });
  assert.equal(data.fingerprints.publicFnv1a, artifactFingerprint(data));
  assert.equal(
    data.fingerprints.captionSetSha256,
    "sha256:65741e59ab66c04254f9c40a5051308a8bb1cf6b121078737ba5b81f1b25d5fc",
  );
});

test("pins every launch receipt to its exact source, date, and coordinate", () => {
  const { engine } = actualFixture();
  const cases = [
    {
      id: "docket:anger-forecast-to-death-talk",
      signal: "OPEN",
      forecast: [
        "ZMaNz5FTCwY",
        "2018-10-21",
        6131.5,
        "I think Michaels gonna be really pissed about how Judy Greer is character tricked him",
      ],
      response: [
        "5HfhwoDSQ0E",
        "2021-10-30",
        6110,
        "it's not a dream she's [BLEEP] dead Karen's dead",
      ],
      days: 1105,
    },
    {
      id: "docket:scream-vi-anticipation-to-reception",
      signal: "MAY_SUPPORT",
      forecast: [
        "O5vtdQnH7uc",
        "2022-12-29",
        11809.14,
        "my number one's gonna be Scream Six um my favorite horror franchise",
      ],
      response: [
        "ISDlaQ9DWSM",
        "2023-04-25",
        7067.4,
        "it's still [BLEEP] rules Scream is the best man",
      ],
      days: 117,
    },
    {
      id: "docket:halloween-ends-excitement-to-mixed-reaction",
      signal: "MAY_BE_MIXED",
      forecast: [
        "ETuRUYiQEBM",
        "2022-07-28",
        8507.2,
        "hope when we go to the theater and see Halloween Ends we get just blown away",
      ],
      response: [
        "I6QKteG_hK0",
        "2022-10-18",
        6817.619,
        "it was a failure in the sense of what you promised it would be",
      ],
      days: 82,
    },
    {
      id: "docket:scream-7-commentary-plan-open",
      signal: "OPEN",
      forecast: [
        "7PzSj-oIRjA",
        "2026-06-25",
        7254.84,
        "this month we're going to be doing Scream 7 commentary",
      ],
      response: [
        "LV2rmwEA0w4",
        "2026-07-23",
        3811.52,
        "we're also doing Scream 7 on the 31st",
      ],
      days: 28,
    },
  ];

  for (const expected of cases) {
    const inspection = plain(engine.inspect(expected.id));
    assert.equal(inspection.docket.pairSignal, expected.signal);
    assert.deepEqual(
      [
        inspection.forecast.source.id,
        inspection.forecast.source.date,
        inspection.forecast.candidate.t,
        inspection.forecast.candidate.excerpt,
      ],
      expected.forecast,
    );
    assert.deepEqual(
      [
        inspection.response.source.id,
        inspection.response.source.date,
        inspection.response.candidate.t,
        inspection.response.candidate.excerpt,
      ],
      expected.response,
    );
    assert.equal(inspection.docket.chronology.daysBetween, expected.days);
    assert.equal(inspection.docket.relationship, "MAY_RESOLVE");
    assert.equal(inspection.docket.verdict, null);
    assert.ok(
      inspection.forecast.candidate.url.endsWith(
        `&t=${Math.floor(expected.forecast[2])}s`,
      ),
    );
    assert.ok(
      inspection.response.candidate.url.endsWith(
        `&t=${Math.floor(expected.response[2])}s`,
      ),
    );
    assert.equal(engine.verify(inspection).ok, true);
  }

  const mixed = plain(
    engine.inspect("docket:halloween-ends-excitement-to-mixed-reaction"),
  );
  assert.deepEqual(mixed.response.candidate.additionalReceipts, [
    {
      id: "receipt:halloween-ends-standalone-positive-assessment",
      sourceId: "I6QKteG_hK0",
      t: 6823.679,
      timecode: "1:53:43",
      url: "https://www.youtube.com/watch?v=I6QKteG_hK0&t=6823s",
      window: { from: 6822.78, to: 6829.199 },
      excerpt: "as a standalone movie I still ended up liking it",
      excerptMode: "normalized-automatic-caption-sequence",
      cueTerms: ["ended up liking it", "standalone movie"],
    },
  ]);
  assert.ok(mixed.docket.pairBasis.includes("local-judgments-only"));
  assert.ok(mixed.docket.pairBasis.includes("no-mind-change-claim"));
  assert.ok(mixed.docket.pairBasis.includes("no-speaker-continuity-claim"));
});

test("exposes useful subject browsing without inventing identity continuity", () => {
  const { engine } = actualFixture();
  const subjects = plain(engine.getSubjects());
  const halloween = subjects.find(
    (subject) => subject.id === "franchise:halloween",
  );
  const scream = subjects.find(
    (subject) => subject.id === "franchise:scream",
  );

  assert.equal(Object.isFrozen(engine.getSubjects()), true);
  assert.deepEqual(halloween, {
    id: "franchise:halloween",
    label: "Halloween",
    type: "franchise",
    forecastCount: 2,
    responseCount: 2,
    docketCount: 2,
  });
  assert.deepEqual(scream, {
    id: "franchise:scream",
    label: "Scream",
    type: "franchise",
    forecastCount: 2,
    responseCount: 2,
    docketCount: 2,
  });
  assert.deepEqual(
    plain(engine.list({ subjectId: "film:scream-7" })).map(
      (record) => record.id,
    ),
    ["docket:scream-7-commentary-plan-open"],
  );
  assert.deepEqual(plain(engine.list({ subjectId: "missing:subject" })), []);
  assert.deepEqual(
    plain(engine.list({ reviewStatus: "editor-verified" })),
    [],
  );
  assert.throws(
    () => engine.list({ unknown: true }),
    /Unsupported longitudinal docket filter/,
  );
  assert.throws(
    () => engine.list({ limit: 101 }),
    /between 1 and 100/,
  );
  assert.equal(engine.inspect("docket:missing"), null);
  assert.equal(engine.buildEditBrief("docket:missing"), null);
});

test("builds bounded 30/60/90 edit briefs including every mixed receipt", () => {
  const { engine } = actualFixture();
  const simpleId = "docket:scream-vi-anticipation-to-reception";
  const mixedId = "docket:halloween-ends-excitement-to-mixed-reaction";

  for (const durationSeconds of [30, 60, 90]) {
    const simple = plain(
      engine.buildEditBrief(simpleId, { durationSeconds }),
    );
    const mixed = plain(
      engine.buildEditBrief(mixedId, { durationSeconds }),
    );
    assert.equal(simple.targetDurationSeconds, durationSeconds);
    assert.equal(simple.sequence.length, 2);
    assert.equal(mixed.sequence.length, 3);
    assert.equal(mixed.pairSignal, "MAY_BE_MIXED");
    assert.equal(simple.relationship, "MAY_RESOLVE");
    assert.equal(simple.verdict, null);
    assert.equal(simple.speaker, null);
    assert.equal(simple.promotionAllowed, false);
    assert.equal(simple.autoplay, false);
    assert.equal(engine.verify(simple).ok, true);
    assert.equal(engine.verify(mixed).ok, true);
    assert.equal(
      Math.round(simple.sequence.reduce(
        (total, clip) => total + clip.suggestedWindow.durationSeconds,
        0,
      )),
      durationSeconds,
    );
    assert.equal(
      Math.round(mixed.sequence.reduce(
        (total, clip) => total + clip.suggestedWindow.durationSeconds,
        0,
      )),
      durationSeconds,
    );
    assert.ok([...simple.sequence, ...mixed.sequence].every((clip) => (
      clip.assetStatus === "source-link-only" &&
      clip.speaker === null &&
      clip.promotionAllowed === false &&
      /^https:\/\/www\.youtube\.com\/watch\?v=[A-Za-z0-9_-]{11}&t=\d+s$/.test(
        clip.suggestedWindow.url,
      )
    )));
  }
  assert.throws(
    () => engine.buildEditBrief(simpleId, { durationSeconds: 45 }),
    /exactly 30, 60, or 90/,
  );
  assert.throws(
    () => engine.buildEditBrief(simpleId, { format: "vertical" }),
    /Unsupported edit-brief option/,
  );
});

test("detects packet tampering and keeps structural firewalls after re-fingerprinting", () => {
  const { engine } = actualFixture();
  const inspection = plain(
    engine.inspect("docket:scream-7-commentary-plan-open"),
  );
  const changed = clone(inspection);
  changed.response.candidate.excerpt += " changed";
  const changedReport = plain(engine.verify(changed));

  assert.equal(changedReport.ok, false);
  assert.ok(
    changedReport.errors.some((entry) => entry.code === "fingerprint-mismatch"),
  );
  assert.throws(
    () => engine.serialize(changed),
    (error) => error.code === "LONGITUDINAL_DOCKET_REJECTED",
  );

  const promoted = clone(inspection);
  promoted.docket.promotionAllowed = true;
  promoted.fingerprint = packetFingerprint(promoted);
  const promotedReport = plain(engine.verify(promoted));
  assert.equal(promotedReport.ok, false);
  assert.ok(
    promotedReport.errors.some((entry) => entry.code === "promotion-firewall"),
  );

  const verdict = clone(inspection);
  verdict.docket.verdict = "supported";
  verdict.fingerprint = packetFingerprint(verdict);
  const verdictReport = plain(engine.verify(verdict));
  assert.equal(verdictReport.ok, false);
  assert.ok(
    verdictReport.errors.some((entry) => entry.code === "verdict-firewall"),
  );

  const attributed = clone(inspection);
  attributed.forecast.candidate.speaker = "A host";
  attributed.fingerprint = packetFingerprint(attributed);
  const attributedReport = plain(engine.verify(attributed));
  assert.equal(attributedReport.ok, false);
  assert.ok(
    attributedReport.errors.some(
      (entry) => entry.code === "speaker-inference-firewall",
    ),
  );

  const inflated = clone(inspection);
  inflated.unboundedPayload = ["x".repeat(100_000)];
  inflated.fingerprint = packetFingerprint(inflated);
  const inflatedReport = plain(engine.verify(inflated));
  assert.equal(inflatedReport.ok, false);
  assert.ok(
    inflatedReport.errors.some(
      (entry) => entry.code === "packet-shape-mismatch",
    ),
  );
});

test("serializes a deterministic bounded export with no private payloads", () => {
  const { data, engine } = actualFixture();
  const first = engine.serialize();
  const second = engine.serialize();
  const packet = JSON.parse(first);

  assert.equal(first, second);
  assert.ok(Buffer.byteLength(first, "utf8") < 24_000);
  assert.equal(
    packet.schema,
    "shokker-youtube-wiki/longitudinal-docket-export/v1",
  );
  assert.equal(packet.records.length, 4);
  assert.equal(packet.policy.sourceMediaIncluded, false);
  assert.equal(packet.policy.fullCaptionPayloadPublic, false);
  assert.equal(packet.provenance.dataFingerprint, data.fingerprints.publicFnv1a);
  assert.equal(engine.verify(packet).ok, true);
  assert.ok(everyValue(packet, (key, value) => {
    assert.ok(![
      "audio",
      "captions",
      "events",
      "media",
      "rawCaptions",
      "rawTranscript",
      "segs",
      "subjectBindings",
      "transcript",
      "video",
      "windowCueTerms",
    ].includes(key));
    if (key === "speaker") assert.equal(value, null);
    if (key === "promotionAllowed") assert.equal(value, false);
    if (key === "verdict") assert.equal(value, null);
    if (key === "relationship") assert.equal(value, "MAY_RESOLVE");
    if (key === "excerpt") {
      assert.ok(String(value).trim().split(/\s+/).length <= 16);
    }
    return true;
  }));

  const serialized = first.toLowerCase();
  assert.doesNotMatch(serialized, /"captions"\s*:|"events"\s*:|"segs"\s*:/);
  assert.doesNotMatch(serialized, /"transcript"\s*:|"media"\s*:|"audio"\s*:/);
  assert.doesNotMatch(serialized, /"verdict"\s*:\s*"(?:support|contradict|right|wrong)/);
});

test("is deterministic under semantic input order changes", () => {
  const { window, channelPack, data, engine } = actualFixture();
  const reordered = clone(data);
  for (const key of ["subjects", "sources", "claims", "responses", "dockets"]) {
    reordered[key].reverse();
  }
  for (const candidate of [...reordered.claims, ...reordered.responses]) {
    candidate.subjects.reverse();
    candidate.subjectBindings.reverse();
    candidate.cueTerms.reverse();
  }
  for (const docket of reordered.dockets) {
    docket.subjects.reverse();
    docket.pairBasis.reverse();
    docket.resolutionBlockedBy.reverse();
  }

  assert.equal(artifactFingerprint(reordered), data.fingerprints.publicFnv1a);
  const other = window.ShokkerLongitudinalDocket.create({
    channelPack,
    data: reordered,
  });
  assert.deepEqual(plain(other.list()), plain(engine.list()));
  assert.equal(other.serialize(), engine.serialize());
});

test("the same engine accepts a neutral racing ChannelPack without identity leakage", () => {
  const window = load([
    "channel-pack-contract.js",
    "longitudinal-docket-engine.js",
  ]);
  const channelPack = neutralPack(window);
  const data = neutralData(channelPack);
  const engine = window.ShokkerLongitudinalDocket.create({
    channelPack,
    data,
  });
  const serialized = engine.serialize();

  assert.equal(channelPack.identity.id, "sample-racing");
  assert.ok(channelPack.capabilities.includes("longitudinal-claim-ledger"));
  assert.deepEqual(plain(engine.list()), [
    {
      id: "docket:car-33-round-4",
      title: "Round 4 // BEFORE THE GREEN → AFTER THE FLAG",
      subjects: ["event:round-4", "participant:car-33"],
      forecast: {
        sourceId: "abcRACE1234",
        date: "2026-07-15",
        t: 500,
        timecode: "8:20",
        url: "https://www.youtube.com/watch?v=abcRACE1234&t=500s",
      },
      response: {
        sourceId: "xyzRACE5678",
        date: "2026-07-22",
        t: 2400,
        timecode: "40:00",
        url: "https://www.youtube.com/watch?v=xyzRACE5678&t=2400s",
      },
      relationship: "MAY_RESOLVE",
      pairSignal: "MAY_SUPPORT",
      verdict: null,
      resolutionStatus: "unresolved",
      reviewStatus: "machine-paired-unreviewed",
      requiresWholeWorkVisualReview: false,
      visualOutcomeVerified: false,
      speaker: null,
      promotionAllowed: false,
    },
  ]);
  assert.doesNotMatch(
    fs.readFileSync(enginePath, "utf8"),
    /WWAM|Scream|Halloween|horror|Stu|Karen|racing/i,
  );
  assert.doesNotMatch(
    serialized,
    /WWAM|Scream|Halloween|horror|Stu|Karen|UP IN YA|TAPE KEEPS SCORE/i,
  );
});

test("requires the explicit longitudinal capability but no channel-specific rule", () => {
  const window = load([
    "channel-pack-contract.js",
    "longitudinal-docket-engine.js",
  ]);
  const adapter = clone(NEUTRAL_RACING_ADAPTER);
  adapter.capabilities = adapter.capabilities.filter(
    (capability) => capability !== "longitudinal-claim-ledger",
  );
  const channelPack = neutralPack(window, adapter);
  const data = neutralData(channelPack);

  assert.equal(window.ShokkerChannelPack.validate(channelPack).valid, true);
  assert.throws(
    () => window.ShokkerLongitudinalDocket.create({ channelPack, data }),
    (error) => issueCodes(error).has("missing-capability"),
  );
});

test("fails closed on speaker, promotion, verdict, relationship, and excerpt tampering", () => {
  const window = load([
    "channel-pack-contract.js",
    "longitudinal-docket-engine.js",
  ]);
  const channelPack = neutralPack(window);
  const base = neutralData(channelPack);
  const cases = [
    {
      code: "speaker-inference-firewall",
      mutate(data) {
        data.claims[0].speaker = "Announcer";
      },
    },
    {
      code: "promotion-firewall",
      mutate(data) {
        data.responses[0].promotionAllowed = true;
      },
    },
    {
      code: "verdict-firewall",
      mutate(data) {
        data.dockets[0].verdict = "supported";
      },
    },
    {
      code: "truth-claim-firewall",
      mutate(data) {
        data.dockets[0].relationship = "SUPPORTS";
      },
    },
    {
      code: "excerpt-limit",
      mutate(data) {
        data.claims[0].excerpt = Array.from(
          { length: 17 },
          (_, index) => `word${index}`,
        ).join(" ");
      },
    },
    {
      code: "noncanonical-timestamp-url",
      mutate(data) {
        data.responses[0].url =
          "https://www.youtube.com/watch?v=xyzRACE5678&t=1s";
      },
    },
    {
      code: "private-payload-field",
      mutate(data) {
        data.captions = ["private"];
      },
    },
  ];

  for (const entry of cases) {
    const data = clone(base);
    entry.mutate(data);
    assertRejected(window, channelPack, data, entry.code);
  }

  const unfingerprinted = clone(base);
  unfingerprinted.claims[0].excerpt += " changed";
  assert.throws(
    () => window.ShokkerLongitudinalDocket.create({
      channelPack,
      data: unfingerprinted,
    }),
    (error) => issueCodes(error).has("fingerprint-mismatch"),
  );
});

test("blocks metadata-only, restricted-audio, visual, and same-topic shortcuts", () => {
  const window = load([
    "channel-pack-contract.js",
    "longitudinal-docket-engine.js",
  ]);
  const channelPack = neutralPack(window);
  const base = neutralData(channelPack);

  const metadata = clone(base);
  metadata.sources[0].rightsMode = "metadata-only";
  metadata.sources[0].evidenceAccess = "metadata-only";
  assertRejected(
    window,
    channelPack,
    metadata,
    "source-evidence-firewall",
  );

  const restricted = clone(base);
  restricted.sources[1].rightsMode = "trailer-audio-boundary-unverified";
  restricted.sources[1].evidenceAccess = "topic-navigation-only";
  assertRejected(
    window,
    channelPack,
    restricted,
    "source-evidence-firewall",
  );

  const visual = clone(base);
  visual.sources[1].rightsMode = "visual-context-unverified";
  visual.sources[1].evidenceAccess = "short-caption-candidate";
  assertRejected(window, channelPack, visual, "visual-source-firewall");

  const falseVisualVerdict = clone(base);
  falseVisualVerdict.sources[1].rightsMode = "visual-context-unverified";
  falseVisualVerdict.sources[1].evidenceAccess = "short-caption-candidate";
  falseVisualVerdict.dockets[0].requiresWholeWorkVisualReview = true;
  falseVisualVerdict.dockets[0].resolutionBlockedBy.push(
    "whole-work-visual-review-required",
  );
  falseVisualVerdict.dockets[0].visualOutcomeVerified = true;
  assertRejected(
    window,
    channelPack,
    falseVisualVerdict,
    "visual-outcome-firewall",
  );

  const noSharedSubject = clone(base);
  noSharedSubject.subjects.push({
    id: "participant:car-12",
    label: "Car 12",
    type: "participant",
  });
  noSharedSubject.responses[0].subjects = ["participant:car-12"];
  assertRejected(
    window,
    channelPack,
    noSharedSubject,
    "subject-pair-mismatch",
  );

  const sameSource = clone(base);
  sameSource.responses[0].sourceId = sameSource.claims[0].sourceId;
  sameSource.responses[0].url =
    "https://www.youtube.com/watch?v=abcRACE1234&t=1200s";
  sameSource.responses[0].t = 1200;
  sameSource.responses[0].window = { from: 1194, to: 1210 };
  assertRejected(window, channelPack, sameSource, "same-source-pair");
});

test("MAY_BE_MIXED requires a real countervailing later receipt", () => {
  const { window, channelPack, data } = actualFixture();
  const mixed = clone(data);
  const docket = mixed.dockets.find(
    (entry) => (
      entry.id === "docket:halloween-ends-excitement-to-mixed-reaction"
    ),
  );
  const response = mixed.responses.find(
    (entry) => entry.id === docket.responseId,
  );
  response.additionalReceipts = [];

  assertRejected(window, channelPack, mixed, "mixed-signal-firewall");

  const inflated = clone(data);
  inflated.dockets[0].pairSignal = "SUPPORTED";
  assertRejected(window, channelPack, inflated, "unsupported-pair-signal");
});

test("the offline pipeline proves and reproduces all source bindings byte-for-byte", () => {
  const output = execFileSync(
    "python",
    ["pipeline/wwam_longitudinal_docket.py", "--check"],
    { cwd: root, encoding: "utf8", timeout: 120_000 },
  );
  const window = load(["longitudinal-docket-data.js"]);
  const data = plain(window.WWAM_LONGITUDINAL_DOCKETS);

  assert.match(
    output,
    /Validated longitudinal-docket-data\.js: 4 cases, 8 sources/,
  );
  assert.match(output, /17,626 public bytes/);
  assert.match(output, /fnv1a32:59b085f6/);
  assert.ok(fs.statSync(dataPath).size < 32_000);
  assert.equal(data.provenance.networkUsed, false);
  assert.equal(data.provenance.fullCaptionPayloadPublic, false);
  assert.equal(data.provenance.privateInput, "local-caption-cache");
  assert.equal(
    data.provenance.publicInput,
    "bounded-source-metadata-and-caption-excerpts",
  );
  assert.equal(data.provenance.integrityNote, "change-detector-only");
  assert.deepEqual(
    Object.fromEntries(
      data.sources.map((source) => [source.id, source.captionPayloadSha256]),
    ),
    {
      ZMaNz5FTCwY:
        "sha256:72a44318f44476c888ad7e9f6772784ea241d2f7496602c61a7c4595f4038077",
      "5HfhwoDSQ0E":
        "sha256:2b197a86b73bbae5cda942741bec0315688eadadc4ae3533382ae4689a2bda2f",
      O5vtdQnH7uc:
        "sha256:47c67ef636a17c7470ea36498bb9b31d68bc08edc2384d3ad95815e5175bddc0",
      ISDlaQ9DWSM:
        "sha256:e6cc9f73bca55fb7903fe9be6f602d6bb4c1a6956ee8b5392acdf56a0898fc9e",
      ETuRUYiQEBM:
        "sha256:02b6b1bbb434bb0bdc294da92ae0be847a23c334727ee14ba4f448bf871d9b27",
      I6QKteG_hK0:
        "sha256:5039c0b8d99c8011351cef29ca9ae036c6ff5603f716ff4e796d4169765d604b",
      "7PzSj-oIRjA":
        "sha256:d5295dc2e13e79fef3e6a4260adcb9c8a72b647319be1d90b4df85af1acab364",
      LV2rmwEA0w4:
        "sha256:1f4d7e00c51ed981f223b6bf707431dd650bd6b02ce196b3fbf7dc87ab25a4a7",
    },
  );
});
