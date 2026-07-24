import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import vm from "node:vm";
import { fileURLToPath } from "node:url";
import {
  NEUTRAL_RACING_ADAPTER,
  NEUTRAL_RACING_DNA,
} from "./fixtures/channel-pack-neutral-racing.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(here, "..");
const demo = path.join(root, "public", "demo");
const enginePath = path.join(demo, "fresh-tape-intake-engine.js");

function plain(value) {
  return JSON.parse(JSON.stringify(value));
}

function stableValue(value) {
  if (Array.isArray(value)) return value.map(stableValue);
  if (value && typeof value === "object") {
    return Object.keys(value)
      .sort()
      .reduce((result, key) => {
        if (value[key] !== undefined && typeof value[key] !== "function") {
          result[key] = stableValue(value[key]);
        }
        return result;
      }, Object.create(null));
  }
  return value;
}

function fingerprint(prefix, value) {
  const canonical = JSON.stringify(stableValue(value));
  const hash32 = (input, seed) => {
    let hash = seed >>> 0;
    for (let index = 0; index < input.length; index += 1) {
      const code = input.charCodeAt(index);
      hash ^= code & 0xff;
      hash = Math.imul(hash, 0x01000193);
      hash ^= code >>> 8;
      hash = Math.imul(hash, 0x01000193);
    }
    return hash >>> 0;
  };
  const hex = (value) => value.toString(16).padStart(8, "0");
  return `${prefix}-${hex(hash32(canonical, 0x811c9dc5))}${hex(
    hash32(`${prefix}\u0000${canonical}`, 0x9e3779b9),
  )}`;
}

function resign(artifact) {
  const output = plain(artifact);
  delete output.fingerprint;
  output.fingerprint = fingerprint("fti1", output);
  return output;
}

function resignEvidenceLedger(artifact) {
  const output = plain(artifact);
  output.evidenceLedger.fingerprint = fingerprint(
    "ftel1",
    output.evidenceLedger.entries,
  );
  return resign(output);
}

function load() {
  const sandbox = { window: {} };
  vm.createContext(sandbox);
  [
    "wwam-channel-dna.js",
    "wwam-channel-pack-adapter.js",
    "channel-pack-contract.js",
    "fresh-tape-intake-engine.js",
  ].forEach((file) => {
    vm.runInContext(fs.readFileSync(path.join(demo, file), "utf8"), sandbox, {
      filename: file,
    });
  });
  return sandbox.window;
}

function adapterWithCapability(adapter) {
  const output = plain(adapter);
  if (!output.capabilities.includes("fresh-tape-intake")) {
    output.capabilities.push("fresh-tape-intake");
  }
  return output;
}

function wwamRules() {
  return {
    topics: [
      {
        id: "scream",
        label: "SCREAM",
        terms: ["scream", "ghostface"],
      },
      {
        id: "halloween",
        label: "HALLOWEEN",
        terms: ["halloween", "michael myers"],
      },
    ],
    signals: [
      {
        id: "room-break",
        label: "THE ROOM BREAKS",
        terms: ["oh my god", "no way"],
      },
    ],
  };
}

function racingRules() {
  return {
    topics: [
      {
        id: "lead-change",
        label: "LEAD CHANGE",
        terms: ["lead change", "new leader"],
      },
    ],
    signals: [
      {
        id: "rollover",
        label: "UPSIDE DOWN",
        terms: ["upside down", "on its roof"],
      },
    ],
  };
}

function compileWwam(window) {
  return window.ShokkerChannelPack.compile(
    window.WWAM_CHANNEL_DNA,
    adapterWithCapability(window.WWAM_CHANNEL_PACK_ADAPTER),
  );
}

function compileRacing(window) {
  return window.ShokkerChannelPack.compile(
    NEUTRAL_RACING_DNA,
    adapterWithCapability(NEUTRAL_RACING_ADAPTER),
  );
}

function createWwam(window, options = {}) {
  return window.ShokkerFreshTapeIntakeEngine.create({
    channelPack: options.channelPack || compileWwam(window),
    rules: options.rules || wwamRules(),
    limits: options.limits,
  });
}

function createRacing(window) {
  return window.ShokkerFreshTapeIntakeEngine.create({
    channelPack: compileRacing(window),
    rules: racingRules(),
  });
}

function source(id = "FreshTape01", overrides = {}) {
  return {
    id,
    url: `https://www.youtube.com/watch?v=${id}`,
    title: "Fresh tape adversarial source",
    date: "2026-07-24",
    durationSeconds: 180,
    lane: "fresh-live",
    ...overrides,
  };
}

function assertCode(fn, code) {
  assert.throws(fn, (error) => {
    assert.equal(error.code, code);
    assert.equal(typeof error.message, "string");
    assert.ok(error.message.length > 0);
    return true;
  });
}

function intake(engine, transcript, sourceOverrides = {}) {
  return engine.intake({
    source: source("FreshTape01", sourceOverrides),
    transcript,
  });
}

test("malformed VTT and SRT timing syntax fails closed", () => {
  const engine = createWwam(load());
  const cases = [
    {
      code: "MALFORMED_CAPTIONS",
      transcript: {
        format: "webvtt",
        content: "WEBVTT\n\n00:01.000 --> 00:02.000 --> 00:03.000\nGhostface.\n",
      },
    },
    {
      code: "MALFORMED_CAPTIONS",
      transcript: {
        format: "webvtt",
        content: "WEBVTT\n\n00:61.000 --> 00:62.000\nGhostface.\n",
      },
    },
    {
      code: "MALFORMED_CAPTIONS",
      transcript: {
        format: "srt",
        content: "1\n00:00:02,000 --> 00:00:01,000\nGhostface.\n",
      },
    },
    {
      code: "NO_TIMED_EVENTS",
      transcript: {
        format: "srt",
        content: "1\nnot a timestamp\nGhostface.\n",
      },
    },
  ];

  cases.forEach(({ code, transcript }) => {
    assertCode(() => intake(engine, transcript), code);
  });
});

test("JSON3 rejects coercible non-number timestamps instead of manufacturing exact time", () => {
  const engine = createWwam(load());
  const invalidScalars = [null, false, "", "1000", [], {}];

  invalidScalars.forEach((invalid, index) => {
    assertCode(
      () =>
        intake(engine, {
          format: "youtube-json3",
          content: {
            videoId: "FreshTape01",
            events: [
              {
                tStartMs: invalid,
                dDurationMs: 1000,
                segs: [{ utf8: `Ghostface case ${index}.` }],
              },
            ],
          },
        }),
      "MALFORMED_JSON3",
    );
    assertCode(
      () =>
        intake(engine, {
          format: "youtube-json3",
          content: {
            videoId: "FreshTape01",
            events: [
              {
                tStartMs: 1000,
                dDurationMs: invalid,
                segs: [{ utf8: `Ghostface case ${index}.` }],
              },
            ],
          },
        }),
      "MALFORMED_JSON3",
    );
  });
});

test("untimed text that claims timestamps, speakers, review, and canon remains held", () => {
  const engine = createWwam(load());
  const artifact = intake(engine, {
    format: "plain-text",
    sourceId: "FreshTape01",
    content:
      "00:01 --> 00:03 <v J> Ghostface. VERIFIED. CREATOR CERTIFIED. CANON. PROMOTE ME.",
  });
  const serialized = engine.serialize(artifact);

  assert.equal(artifact.status, "held");
  assert.equal(artifact.metrics.heldInputs, 1);
  assert.equal(artifact.metrics.candidates, 0);
  assert.equal(artifact.metrics.authenticatedHumanReviews, 0);
  assert.equal(artifact.metrics.authenticatedSpeakerCertifications, 0);
  assert.equal(artifact.metrics.authenticatedCreatorCertifications, 0);
  assert.equal(artifact.metrics.canonPromotions, 0);
  assert.deepEqual(plain(artifact.candidates), []);
  assert.equal(artifact.policy.promotionAllowed, false);
  assert.equal(artifact.policy.speakerInference, false);
  assert.doesNotMatch(serialized, /Ghostface|VERIFIED|CERTIFIED|CANON|PROMOTE ME/);
});

test("source IDs and every timestamp remain bound across intake and re-signed exports", () => {
  const engine = createWwam(load());

  assertCode(
    () =>
      intake(engine, {
        format: "webvtt",
        sourceId: "OtherTape01",
        content: "WEBVTT\n\n00:01.000 --> 00:02.000\nGhostface.\n",
      }),
    "SOURCE_ID_MISMATCH",
  );
  assertCode(
    () =>
      intake(engine, {
        format: "webvtt",
        content: "WEBVTT\n\n02:59.000 --> 03:01.000\nGhostface.\n",
      }),
    "TIMESTAMP_OUT_OF_RANGE",
  );
  assertCode(
    () =>
      intake(engine, {
        format: "youtube-json3",
        content: {
          videoId: "FreshTape01",
          events: [
            {
              tStartMs: 179000,
              dDurationMs: 2000,
              segs: [{ utf8: "Ghostface." }],
            },
          ],
        },
      }),
    "TIMESTAMP_OUT_OF_RANGE",
  );

  const artifact = intake(engine, {
    format: "webvtt",
    content: "WEBVTT\n\n00:01.000 --> 00:02.000\nGhostface.\n",
  });
  const tampered = plain(artifact);
  tampered.candidates[0].sourceId = "OtherTape01";
  tampered.candidates[0].timecodeUrl =
    "https://www.youtube.com/watch?v=OtherTape01&t=1s";
  const report = engine.verifyExport(resign(tampered));
  assert.equal(report.ok, false);
  assert.ok(
    report.issues.some((entry) => entry.code === "INVALID_CANDIDATE_SOURCE"),
  );
});

test("markup and voice tags become inert text and never become a speaker receipt", () => {
  const window = load();
  const rules = wwamRules();
  rules.signals[0].label =
    "<svg onload=alert(1)>THE ROOM BREAKS</svg>";
  const engine = createWwam(window, { rules });
  const artifact = intake(
    engine,
    {
      format: "webvtt",
      content: `WEBVTT

00:01.000 --> 00:03.000
<v Mike><img src=x onerror=alert(2)>Ghostface says no way <script>alert(3)</script>
`,
    },
    {
      title:
        "<script>window.pwned=true</script>Fresh <img src=x onerror=alert(4)> tape",
    },
  );
  const serialized = engine.serialize(artifact);

  assert.equal(artifact.candidates.length, 2);
  artifact.candidates.forEach((candidate) => {
    assert.equal(candidate.speaker, null);
    assert.equal(candidate.speakerStatus, "not-diarized");
    assert.equal(candidate.authenticatedReviewCount, 0);
    assert.equal(candidate.authenticatedCertificationCount, 0);
    assert.doesNotMatch(candidate.label, /[<>]/);
    assert.doesNotMatch(candidate.excerpt.text, /[<>]/);
  });
  assert.doesNotMatch(serialized, /<(?:script|img|svg|v)\b/i);
  assert.equal("pwned" in window, false);
});

test("fake verified, certified, canon, promotion, and speaker fields fail even when re-signed", () => {
  const engine = createWwam(load());
  const artifact = intake(engine, {
    format: "webvtt",
    content: "WEBVTT\n\n00:01.000 --> 00:02.000\nGhostface says no way.\n",
  });
  const attacks = [
    {
      expected: "INVALID_CANDIDATE_STRUCTURE",
      mutate(value) {
        value.candidates[0].verified = true;
        value.candidates[0].certified = true;
        value.candidates[0].canon = true;
      },
    },
    {
      expected: "UNSAFE_CANDIDATE",
      mutate(value) {
        value.candidates[0].state = "canon";
        value.candidates[0].reviewStatus = "creator-certified";
        value.candidates[0].promotionAllowed = true;
        value.candidates[0].authenticatedReviewCount = 1;
        value.candidates[0].authenticatedCertificationCount = 1;
      },
    },
    {
      expected: "UNSAFE_CANDIDATE",
      mutate(value) {
        value.candidates[0].speaker = "Mike";
        value.candidates[0].speakerStatus = "diarized";
      },
    },
    {
      expected: "UNSUPPORTED_EXPORT_FIELD",
      mutate(value) {
        value.certifiedBy = "forged-owner";
      },
    },
  ];

  attacks.forEach(({ expected, mutate }) => {
    const tampered = plain(artifact);
    mutate(tampered);
    const report = engine.verifyExport(resign(tampered));
    assert.equal(report.ok, false);
    assert.equal(report.fingerprint, null);
    assert.ok(
      report.issues.some((entry) => entry.code === expected),
      `${expected} missing from ${JSON.stringify(report.issues)}`,
    );
  });
});

test("fingerprints are deterministic structural change detectors, never authority receipts", () => {
  const engine = createWwam(load());
  const artifact = intake(engine, {
    format: "webvtt",
    content: "WEBVTT\n\n00:01.000 --> 00:02.000\nGhostface says no way.\n",
  });
  const first = engine.serialize(artifact);
  const second = engine.serialize(plain(artifact));
  const verified = engine.verifyExport(first);

  assert.equal(first, second);
  assert.deepEqual(Object.keys(plain(verified)).sort(), [
    "authenticityVerified",
    "authorityVerified",
    "fingerprint",
    "issues",
    "ok",
    "scope",
    "sourceContentVerified",
  ]);
  assert.equal(verified.ok, true);
  assert.equal(verified.scope, "structural-change-detection-only");
  assert.equal(verified.authenticityVerified, false);
  assert.equal(verified.sourceContentVerified, false);
  assert.equal(verified.authorityVerified, false);
  assert.equal("trusted" in verified, false);
  assert.equal(artifact.source.channelOwnershipVerified, false);
  assert.equal(artifact.source.authorityStatus, "channel-ownership-unverified");
  assert.equal(artifact.policy.channelOwnershipVerified, false);
  assert.equal(artifact.policy.promotionAllowed, false);

  const forgedChecksum = plain(artifact);
  forgedChecksum.fingerprint = "fti1-0000000000000000";
  const report = engine.verifyExport(forgedChecksum);
  assert.equal(report.ok, false);
  assert.equal(report.fingerprint, null);
  assert.ok(
    report.issues.some((entry) => entry.code === "FINGERPRINT_MISMATCH"),
  );

  const implementation = fs.readFileSync(enginePath, "utf8");
  assert.doesNotMatch(
    implementation,
    /cryptographic(?:ally)? verified|proof of authenticity|authentic source proof|trusted evidence/i,
  );
});

test("exact duplicates collapse, overlaps survive, and ledger derivation is order-stable", () => {
  const engine = createWwam(load());
  const cues = [
    "00:01.000 --> 00:05.000\nGhostface says no way.",
    "00:01.000 --> 00:05.000\nGhostface says no way.",
    "00:03.000 --> 00:06.000\nScream makes the room yell oh my god.",
  ];
  const artifact = intake(engine, {
    format: "webvtt",
    content: `WEBVTT\n\n${cues.join("\n\n")}\n`,
  });
  const reversed = intake(engine, {
    format: "webvtt",
    content: `WEBVTT\n\n${cues.slice().reverse().join("\n\n")}\n`,
  });

  assert.equal(artifact.ingest.parsedEvents, 3);
  assert.equal(artifact.ingest.uniqueEvents, 2);
  assert.equal(artifact.ingest.duplicatesRemoved, 1);
  assert.equal(artifact.ingest.exactEventLedgerFingerprint.startsWith("ftl1-"), true);
  assert.equal(
    artifact.ingest.exactEventLedgerFingerprint,
    reversed.ingest.exactEventLedgerFingerprint,
  );
  assert.deepEqual(plain(artifact.candidates), plain(reversed.candidates));
  assert.equal(
    new Set(artifact.candidates.map((candidate) => candidate.id)).size,
    artifact.candidates.length,
  );
  assert.ok(
    artifact.candidates.every((candidate) =>
      /^fte1-[0-9a-f]{16}$/.test(candidate.derivation.eventFingerprint),
    ),
  );
});

test("the exact ledger changes for transcript evidence even when candidates do not", () => {
  const engine = createWwam(load());
  const makeArtifact = (unmatchedText) =>
    intake(engine, {
      format: "webvtt",
      content: `WEBVTT

00:01.000 --> 00:02.000
Ghostface.

00:05.000 --> 00:06.000
${unmatchedText}
`,
    });
  const first = makeArtifact("A quiet unmatched line.");
  const second = makeArtifact("A different unmatched line.");

  assert.deepEqual(plain(first.candidates), plain(second.candidates));
  assert.notEqual(
    first.ingest.exactEventLedgerFingerprint,
    second.ingest.exactEventLedgerFingerprint,
  );
  assert.notEqual(first.ingest.payloadFingerprint, second.ingest.payloadFingerprint);
  assert.equal(engine.verifyExport(first).ok, true);
  assert.equal(engine.verifyExport(second).ok, true);
});

test("candidate-event receipts reconcile every candidate without retaining raw text", () => {
  const engine = createWwam(load());
  const unmatchedSecret = "PRIVATE_UNMATCHED_LEDGER_SECRET_7d09";
  const artifact = intake(engine, {
    format: "webvtt",
    content: `WEBVTT

00:01.000 --> 00:03.000
Ghostface says no way.

00:08.000 --> 00:09.000
${unmatchedSecret}
`,
  });
  const ledger = artifact.evidenceLedger;
  const serialized = engine.serialize(artifact);
  const exported = JSON.parse(serialized);

  assert.equal(artifact.ingest.uniqueEvents, 2);
  assert.equal(artifact.ingest.rawTranscriptRetained, false);
  assert.equal(ledger.scope, "candidate-events-only");
  assert.equal(ledger.rawTextRetained, false);
  assert.equal(ledger.entries.length, 1);
  assert.equal(
    ledger.fingerprint,
    fingerprint("ftel1", plain(ledger.entries)),
  );
  assert.deepEqual(plain(ledger.entries[0].matchedRuleIds), [
    "signal:room-break",
    "topic:scream",
  ]);
  assert.deepEqual(plain(ledger.entries[0].matchedRuleTerms), [
    {
      ruleId: "signal:room-break",
      terms: ["no way"],
    },
    {
      ruleId: "topic:scream",
      terms: ["ghostface"],
    },
  ]);
  assert.equal("text" in ledger.entries[0], false);
  assert.equal("normalizedText" in ledger.entries[0], false);

  artifact.candidates.forEach((candidate) => {
    const receipt = ledger.entries.find(
      (entry) =>
        entry.eventFingerprint === candidate.derivation.eventFingerprint,
    );
    assert.ok(receipt);
    assert.equal(receipt.start, candidate.at);
    assert.equal(receipt.end, candidate.end);
    assert.equal(
      receipt.contentFingerprint,
      candidate.derivation.contentFingerprint,
    );
    assert.equal(
      receipt.publicExcerptFingerprint,
      candidate.derivation.publicExcerptFingerprint,
    );
    assert.equal(
      receipt.publicExcerptFingerprint,
      fingerprint("ftx1", plain(candidate.excerpt)),
    );
    assert.ok(
      receipt.matchedRuleIds.includes(
        `${candidate.kind}:${candidate.ruleId}`,
      ),
    );
  });

  assert.equal(engine.verifyExport(artifact).ok, true);
  assert.doesNotMatch(serialized, new RegExp(unmatchedSecret));
  assert.equal("rawTranscript" in exported, false);
  assert.equal("rawTranscript" in exported.ingest, false);
  assert.equal("rawTranscript" in exported.evidenceLedger, false);
  assert.equal(
    exported.evidenceLedger.entries.some(
      (entry) => "text" in entry || "normalizedText" in entry,
    ),
    false,
  );
});

test("re-signed candidate excerpt, term, event, and time changes need ledger reconciliation", () => {
  const engine = createWwam(load());
  const artifact = intake(engine, {
    format: "webvtt",
    content: "WEBVTT\n\n00:01.000 --> 00:03.000\nGhostface says no way.\n",
  });
  const screamIndex = artifact.candidates.findIndex(
    (candidate) => candidate.kind === "topic" && candidate.ruleId === "scream",
  );
  assert.notEqual(screamIndex, -1);

  const attacks = [
    {
      label: "excerpt",
      mutate(value) {
        const candidate = value.candidates[screamIndex];
        candidate.excerpt.text = "Scream says no way.";
        candidate.excerpt.characterCount = "Scream says no way.".length;
      },
    },
    {
      label: "matched term",
      mutate(value) {
        value.candidates[screamIndex].derivation.matchedTerms = ["scream"];
      },
    },
    {
      label: "event",
      mutate(value) {
        const candidate = value.candidates[screamIndex];
        candidate.derivation.eventFingerprint = "fte1-0000000000000000";
        candidate.id = fingerprint("ftc1", {
          kind: candidate.kind,
          ruleId: candidate.ruleId,
          sourceId: candidate.sourceId,
          eventId: candidate.derivation.eventFingerprint,
          at: candidate.at,
        });
      },
    },
    {
      label: "time",
      mutate(value) {
        const candidate = value.candidates[screamIndex];
        candidate.at = 1.25;
        candidate.end = 3.25;
        candidate.timecodeUrl =
          "https://www.youtube.com/watch?v=FreshTape01&t=1s";
        candidate.id = fingerprint("ftc1", {
          kind: candidate.kind,
          ruleId: candidate.ruleId,
          sourceId: candidate.sourceId,
          eventId: candidate.derivation.eventFingerprint,
          at: candidate.at,
        });
      },
    },
  ];

  attacks.forEach(({ label, mutate }) => {
    const tampered = plain(artifact);
    mutate(tampered);
    const report = engine.verifyExport(resign(tampered));
    assert.equal(report.ok, false, `${label} tamper unexpectedly verified`);
    assert.ok(
      report.issues.some(
        (entry) =>
          entry.code === "UNBOUND_CANDIDATE_EVIDENCE" ||
          entry.code === "INVALID_CANDIDATE_DERIVATION",
      ),
      `${label} did not break candidate-event binding: ${JSON.stringify(
        report.issues,
      )}`,
    );
  });

  const coordinated = plain(artifact);
  const coordinatedCandidate = coordinated.candidates[screamIndex];
  const coordinatedEventId =
    coordinatedCandidate.derivation.eventFingerprint;
  coordinated.candidates
    .filter(
      (candidate) =>
        candidate.derivation.eventFingerprint === coordinatedEventId,
    )
    .forEach((candidate) => {
      candidate.excerpt.text = "Scream says no way.";
      candidate.excerpt.characterCount = "Scream says no way.".length;
      candidate.derivation.publicExcerptFingerprint = fingerprint(
        "ftx1",
        candidate.excerpt,
      );
    });
  coordinatedCandidate.derivation.matchedTerms = ["scream"];
  coordinated.evidenceLedger.entries[0].matchedRuleTerms.find(
    (entry) => entry.ruleId === "topic:scream",
  ).terms = ["scream"];
  coordinated.evidenceLedger.entries[0].publicExcerptFingerprint =
    coordinatedCandidate.derivation.publicExcerptFingerprint;
  const structurallyReconciled = engine.verifyExport(
    resignEvidenceLedger(coordinated),
  );
  assert.equal(structurallyReconciled.ok, true);
  assert.equal(
    structurallyReconciled.scope,
    "structural-change-detection-only",
  );
  assert.equal(structurallyReconciled.sourceContentVerified, false);
  assert.equal(structurallyReconciled.authenticityVerified, false);
  assert.equal(structurallyReconciled.authorityVerified, false);
});

test("re-signed forged receipt membership and ledger fingerprints fail closed", () => {
  const engine = createWwam(load());
  const artifact = intake(engine, {
    format: "webvtt",
    content: `WEBVTT

00:01.000 --> 00:03.000
Ghostface says no way.

00:08.000 --> 00:09.000
An unmatched event creates ledger capacity but no candidate.
`,
  });

  const badFingerprint = plain(artifact);
  badFingerprint.evidenceLedger.fingerprint = "ftel1-0000000000000000";
  const badFingerprintReport = engine.verifyExport(resign(badFingerprint));
  assert.equal(badFingerprintReport.ok, false);
  assert.ok(
    badFingerprintReport.issues.some(
      (entry) => entry.code === "INVALID_EVIDENCE_LEDGER",
    ),
  );

  const missingMembership = plain(artifact);
  missingMembership.evidenceLedger.entries = [];
  const missingMembershipReport = engine.verifyExport(
    resignEvidenceLedger(missingMembership),
  );
  assert.equal(missingMembershipReport.ok, false);
  assert.ok(
    missingMembershipReport.issues.some(
      (entry) => entry.code === "UNBOUND_CANDIDATE_EVIDENCE",
    ),
  );

  const orphan = plain(artifact);
  const contentFingerprint = fingerprint("ftx1", "forged orphan event");
  orphan.evidenceLedger.entries.push({
    eventFingerprint: fingerprint("fte1", {
      start: 8,
      end: 9,
      contentFingerprint,
    }),
    start: 8,
    end: 9,
    contentFingerprint,
    publicExcerptFingerprint: fingerprint("ftx1", {
      text: "forged orphan event",
      wordCount: 3,
      sourceWordCount: 3,
      wordLimit: artifact.policy.publicExcerptWordLimit,
      characterCount: "forged orphan event".length,
      characterLimit: artifact.policy.publicExcerptCharacterLimit,
      truncated: false,
    }),
    matchedRuleIds: ["topic:scream"],
    matchedRuleTerms: [
      {
        ruleId: "topic:scream",
        terms: ["ghostface"],
      },
    ],
  });
  orphan.evidenceLedger.entries.sort(
    (left, right) =>
      left.start - right.start ||
      left.end - right.end ||
      left.eventFingerprint.localeCompare(right.eventFingerprint),
  );
  const orphanReport = engine.verifyExport(resignEvidenceLedger(orphan));
  assert.equal(orphanReport.ok, false);
  assert.ok(
    orphanReport.issues.some(
      (entry) => entry.code === "UNREFERENCED_EVIDENCE_RECEIPT",
    ),
    JSON.stringify(orphanReport.issues),
  );
});

test("held untimed text exports an empty candidate-event ledger and no transcript", () => {
  const engine = createWwam(load());
  const secret = "PRIVATE_HELD_TRANSCRIPT_SECRET_801e";
  const artifact = intake(engine, {
    format: "plain-text",
    content: `${secret} Ghostface no way creator certified canon`,
  });
  const serialized = engine.serialize(artifact);
  const exported = JSON.parse(serialized);

  assert.equal(artifact.status, "held");
  assert.equal(artifact.ingest.rawTranscriptRetained, false);
  assert.equal(artifact.evidenceLedger.scope, "candidate-events-only");
  assert.equal(artifact.evidenceLedger.rawTextRetained, false);
  assert.deepEqual(plain(artifact.evidenceLedger.entries), []);
  assert.equal(
    artifact.evidenceLedger.fingerprint,
    fingerprint("ftel1", []),
  );
  assert.deepEqual(plain(artifact.candidates), []);
  assert.equal(engine.verifyExport(artifact).ok, true);
  assert.doesNotMatch(serialized, new RegExp(secret));
  assert.doesNotMatch(serialized, /creator certified canon/i);
  assert.equal("rawTranscript" in exported, false);
  assert.equal("rawTranscript" in exported.ingest, false);
  assert.equal("rawTranscript" in exported.evidenceLedger, false);
});

test("a single giant token cannot amplify one caption into many enormous excerpts", () => {
  const engine = createWwam(load());
  const giantToken = "x".repeat(70_000);

  assertCode(
    () =>
      intake(engine, {
        format: "webvtt",
        content: `WEBVTT

00:01.000 --> 00:03.000
${giantToken} ghostface no way
`,
      }),
    "CHARACTER_LIMIT_EXCEEDED",
  );
});

test("the same quarantine boundary holds for a neutral racing ChannelPack", () => {
  const engine = createRacing(load());
  const artifact = engine.intake({
    source: {
      id: "RaceTape001",
      url: "https://youtu.be/RaceTape001",
      title: "Synthetic Wednesday feature",
      date: "2026-07-24",
      durationSeconds: 90,
      lane: "feature-race",
    },
    transcript: {
      format: "webvtt",
      content: `WEBVTT

00:10.000 --> 00:12.000
New leader after a lead change.

00:20.000 --> 00:22.000
The number seven truck is on its roof.
`,
    },
  });
  const serialized = engine.serialize(artifact);

  assert.equal(artifact.binding.channelId, "sample-racing");
  assert.deepEqual(
    plain(artifact.candidates.map((candidate) => candidate.label)),
    ["LEAD CHANGE", "UPSIDE DOWN"],
  );
  artifact.candidates.forEach((candidate) => {
    assert.equal(candidate.state, "quarantine");
    assert.equal(candidate.publicStateLabel, "REPLAY UNDER REVIEW");
    assert.equal(candidate.promotionAllowed, false);
    assert.equal(candidate.speaker, null);
    assert.equal(candidate.speakerStatus, "not-diarized");
  });
  assert.doesNotMatch(
    serialized,
    /WWAM|Ghostface|Loomis|Halloween|UP IN YA|THE ROOM BREAKS/i,
  );
});
