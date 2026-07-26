import assert from "node:assert/strict";
import { createHash } from "node:crypto";
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
const demo = path.resolve(here, "../public/demo");
const DOCKET_ID = "docket:universal-before-after";
const SESSION = Object.freeze({
  id: "verdict-room-test",
  name: "Verdict Room Test",
  createdAt: "2026-07-24T00:00:00Z",
});
const VERDICT_WORDING = Object.freeze({
  SUPPORTED:
    "Within this reviewed docket, the relied-on later evidence supports the bounded earlier proposition.",
  CONTRADICTED:
    "Within this reviewed docket, the relied-on later evidence contradicts the bounded earlier proposition.",
  MIXED:
    "Within this reviewed docket, the relied-on later evidence both supports and contradicts parts of the bounded earlier proposition.",
});
function plain(value) {
  return JSON.parse(JSON.stringify(value));
}

function clone(value) {
  return structuredClone(plain(value));
}

function freezeOwnDataTree(value, seen = new Set()) {
  if (!value || typeof value !== "object" || seen.has(value)) return value;
  seen.add(value);
  for (const descriptor of Object.values(
    Object.getOwnPropertyDescriptors(value),
  )) {
    if ("value" in descriptor) freezeOwnDataTree(descriptor.value, seen);
  }
  Object.freeze(value);
  return value;
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

function stableJson(value) {
  return JSON.stringify(stableValue(value));
}

function hashCanonical(value) {
  return `sha256:${createHash("sha256").update(stableJson(value)).digest("hex")}`;
}

function rehashEvent(event) {
  const copy = clone(event);
  delete copy.eventHash;
  event.eventHash = hashCanonical(copy);
}

function rehashSnapshot(snapshot) {
  const copy = clone(snapshot);
  delete copy.snapshotHash;
  snapshot.snapshotHash = hashCanonical(copy);
}

function loadRuntime() {
  const sandbox = { window: {} };
  sandbox.globalThis = sandbox.window;
  vm.createContext(sandbox);
  [
    "wwam-channel-dna.js",
    "wwam-channel-pack-adapter.js",
    "channel-pack-contract.js",
  ].forEach((file) => {
    vm.runInContext(fs.readFileSync(path.join(demo, file), "utf8"), sandbox, {
      filename: file,
    });
  });
  sandbox.window.ShokkerLongitudinalDocket = Object.freeze({
    create(options) {
      if (
        typeof sandbox.window.__VERDICT_TEST_ENGINE_PROVIDER !== "function"
      ) {
        throw new Error("Verdict test engine provider is not registered.");
      }
      return sandbox.window.__VERDICT_TEST_ENGINE_PROVIDER(options);
    },
  });
  vm.runInContext(
    fs.readFileSync(path.join(demo, "verdict-room-engine.js"), "utf8"),
    sandbox,
    { filename: "verdict-room-engine.js" },
  );
  return sandbox.window;
}

function compilePack(window, mode = "wwam", includeCapability = true) {
  const dna = clone(
    mode === "racing" ? NEUTRAL_RACING_DNA : window.WWAM_CHANNEL_DNA,
  );
  const adapter = clone(
    mode === "racing"
      ? NEUTRAL_RACING_ADAPTER
      : window.WWAM_CHANNEL_PACK_ADAPTER,
  );
  if (
    includeCapability &&
    !adapter.capabilities.includes("human-adjudication-ledger")
  ) {
    adapter.capabilities.push("human-adjudication-ledger");
  } else if (!includeCapability) {
    adapter.capabilities = adapter.capabilities.filter(
      (capability) => capability !== "human-adjudication-ledger",
    );
  }
  return window.ShokkerChannelPack.compile(dna, adapter);
}

function packetFor(pack, mode = "wwam") {
  const label = mode === "racing"
    ? "Sample Racing Memory"
    : "We Watched A Movie";
  return {
    channel: {
      id: pack.identity.id,
      label,
      packFingerprint: pack.fingerprint,
    },
    labels: {
      product: mode === "racing"
        ? "REPLAY REVIEW"
        : "THE TAPE KEEPS SCORE",
      forecast: "BEFORE",
      response: "AFTER",
      unresolved: "OPEN",
      editBrief: "REVIEW BRIEF",
    },
    docket: {
      id: DOCKET_ID,
      title: mode === "racing"
        ? "Fuel call before → finish after"
        : "Trailer hope before → commentary reaction after",
      claimId: "claim:before",
      responseId: "response:after",
      subjects: [
        mode === "racing" ? "event:feature" : "film:example",
        "topic:before-after",
      ],
      relationship: "MAY_RESOLVE",
      pairSignal: "MAY_BE_MIXED",
      pairBasis: [
        "chronological-distinct-sources",
        "mixed-response-receipts",
        "no-speaker-continuity-claim",
      ],
      chronology: {
        forecastDate: "2026-07-01",
        responseDate: "2026-07-08",
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
    forecast: {
      candidate: {
        id: "claim:before",
        sourceId: "AAAAAAAAAAA",
        role: "forecast",
        t: 61.25,
        timecode: "1:01",
        url: "https://www.youtube.com/watch?v=AAAAAAAAAAA&t=61s",
        window: { from: 58, to: 68 },
        excerpt: mode === "racing"
          ? "this fuel call should get the truck to the finish"
          : "I hope this one completely blows us away",
        excerptMode: "normalized-caption-sequence",
        subjects: ["topic:before-after"],
        subjectBindings: [],
        cueType: "explicit-forecast-language",
        cueTerms: ["should", "finish"],
        windowCueTerms: [],
        additionalReceipts: [],
        speaker: null,
        originStatus: "not-inferred",
        reviewStatus: "machine-candidate",
        promotionAllowed: false,
        visualContextVerified: false,
      },
      source: {
        id: "AAAAAAAAAAA",
        title: mode === "racing" ? "Feature Race Preview" : "Preview Live",
        date: "2026-07-01",
        durationSeconds: 4_000,
        url: "https://www.youtube.com/watch?v=AAAAAAAAAAA",
        lane: mode === "racing" ? "feature-race" : "fresh-live",
        contentMode: mode === "racing" ? "feature-race" : "q-and-a",
        rightsMode: "standard-caption-candidates",
        evidenceAccess: "short-caption-candidate",
        captionTrack: "youtube-automatic-caption",
        captionPayloadSha256: `sha256:${"1".repeat(64)}`,
        speakerDiarized: false,
        originAttribution: false,
        visualContextVerified: false,
        promotionAllowed: false,
      },
    },
    response: {
      candidate: {
        id: "response:after",
        sourceId: "BBBBBBBBBBB",
        role: "response",
        t: 125.75,
        timecode: "2:05",
        url: "https://www.youtube.com/watch?v=BBBBBBBBBBB&t=125s",
        window: { from: 122, to: 132 },
        excerpt: mode === "racing"
          ? "the fuel call worked and the truck made the finish"
          : "this still rules and I love the result",
        excerptMode: "normalized-caption-sequence",
        subjects: ["topic:before-after"],
        subjectBindings: [],
        cueType: "retrospective-response-language",
        cueTerms: ["worked", "finish"],
        windowCueTerms: [],
        additionalReceipts: [{
          id: "receipt:after-counterweight",
          sourceId: "BBBBBBBBBBB",
          t: 300.5,
          timecode: "5:00",
          url: "https://www.youtube.com/watch?v=BBBBBBBBBBB&t=300s",
          window: { from: 298, to: 305 },
          excerpt: mode === "racing"
            ? "that same strategy also left them exposed late"
            : "this other section does not work for me at all",
          excerptMode: "normalized-caption-sequence",
          cueTerms: ["does not work"],
        }],
        speaker: null,
        originStatus: "not-inferred",
        reviewStatus: "machine-candidate",
        promotionAllowed: false,
        visualContextVerified: false,
      },
      source: {
        id: "BBBBBBBBBBB",
        title: mode === "racing" ? "Feature Race Broadcast" : "Commentary",
        date: "2026-07-08",
        durationSeconds: 5_000,
        url: "https://www.youtube.com/watch?v=BBBBBBBBBBB",
        lane: mode === "racing" ? "feature-race" : "commentary",
        contentMode: mode === "racing" ? "feature-race" : "feature-commentary",
        rightsMode: "standard-caption-candidates",
        evidenceAccess: "short-caption-candidate",
        captionTrack: "youtube-automatic-caption",
        captionPayloadSha256: `sha256:${"2".repeat(64)}`,
        speakerDiarized: false,
        originAttribution: false,
        visualContextVerified: false,
        promotionAllowed: false,
      },
    },
    guardrail: {
      relationshipAuthority: "MAY_RESOLVE only",
      verdictAuthority: "authenticated-human-review-required",
      sourceMediaIncluded: false,
      requiresAuthenticatedHumanReview: true,
    },
    schema: "shokker-youtube-wiki/longitudinal-docket-inspection/v1",
    schemaVersion: "1.0.0",
    generated: "2026-07-24",
    fingerprint: "fnv1a32:11223344",
  };
}

function fixture(mode = "wwam", includeCapability = true) {
  const window = loadRuntime();
  const pack = compilePack(window, mode, includeCapability);
  const packet = packetFor(pack, mode);
  const data = {
    schema: "shokker-youtube-wiki/longitudinal-docket-data/v1",
    channel: {
      id: pack.identity.id,
      packFingerprint: pack.fingerprint,
    },
    fingerprints: {
      publicFnv1a: "fnv1a32:55667788",
      captionSetSha256: `sha256:${"a".repeat(64)}`,
    },
    dockets: [{ id: DOCKET_ID }],
  };
  const engine = Object.freeze({
    inspect(id) {
      return id === DOCKET_ID ? clone(packet) : null;
    },
    verify(value) {
      if (arguments.length === 0) {
        return { ok: true, kind: "data-artifact" };
      }
      return {
        ok: stableJson(value) === stableJson(packet),
        kind: "inspection",
      };
    },
    serialize(value) {
      if (!this.verify(value).ok) {
        const error = new Error("Synthetic canonical packet rejected.");
        error.code = "LONGITUDINAL_DOCKET_REJECTED";
        throw error;
      }
      return stableJson(value);
    },
  });
  window.__VERDICT_TEST_ENGINE_PROVIDER = (
    { channelPack, data: currentData },
  ) => {
    assert.equal(channelPack, pack);
    assert.deepEqual(plain(currentData), plain(data));
    return engine;
  };
  const vocabulary = clone(pack.adjudicationVocabulary);
  const options = {
    channelPack: pack,
    docketData: data,
    session: clone(SESSION),
  };
  return { data, engine, mode, options, pack, packet, vocabulary, window };
}

function clock() {
  let tick = 0;
  return () => new Date(
    Date.parse(SESSION.createdAt) + (++tick * 60_000),
  ).toISOString();
}

function human(next, notes = "Human reviewed this exact local boundary.") {
  return {
    at: next(),
    reviewer: {
      role: "editor",
      name: "Local Reviewer",
      id: "reviewer-local",
      humanAttested: true,
    },
    notes,
  };
}

function dispositions(room, mode) {
  return plain(room.getDocket(DOCKET_ID).requiredReceipts).map((receipt) => {
    let disposition = "RELIED_ON";
    let stance = "PROPOSITION";
    if (receipt.role !== "FORECAST") {
      if (mode === "mixed") {
        stance = receipt.role === "RESPONSE"
          ? "SUPPORTING"
          : "CONTRADICTING";
      } else if (mode === "contradicted") {
        stance = receipt.role === "RESPONSE"
          ? "CONTRADICTING"
          : "NEUTRAL";
        if (receipt.role === "ADDITIONAL_RESPONSE") {
          disposition = "CONTEXT_ONLY";
        }
      } else {
        stance = receipt.role === "RESPONSE" ? "SUPPORTING" : "NEUTRAL";
        if (receipt.role === "ADDITIONAL_RESPONSE") {
          disposition = "CONTEXT_ONLY";
        }
      }
    }
    return {
      receiptId: receipt.id,
      disposition,
      stance,
      reason: `Human disposition for ${receipt.role.toLowerCase()}.`,
    };
  });
}

function completeChecks(room, next, mode = "supported") {
  const evidenceCodes = plain(
    room.policy.checkCodes.filter((code) => code !== "PUBLIC_WORDING"),
  );
  const events = [];
  for (const code of evidenceCodes) {
    const action = {
      ...human(next, `Human passed ${code}.`),
      code,
      status: "PASS",
    };
    if (code === "CONTRADICTION_SWEEP") {
      action.receiptDispositions = dispositions(room, mode);
    }
    if (code === "OUTCOME_REVIEW") {
      action.outcomeReview = {
        method: "WHOLE_WORK_REVIEW",
        sourceReference: "Local whole-work review of the registered source.",
        notes: "The reviewer checked the bounded outcome in context.",
      };
    }
    events.push(room.recordCheck(DOCKET_ID, action));
  }
  return events;
}

function adjudicationBinding(room) {
  const review = plain(room.getDocket(DOCKET_ID).review);
  return {
    expectedRevision: review.revision,
    wording: review.wording,
    wordingEventId: review.wordingEventId,
    checkEventIds: review.checks.map((check) => check.eventId),
  };
}

function adjudicatedFixture(
  verdictCode = "SUPPORTED",
  mode = "supported",
  fixtureMode = "wwam",
) {
  const current = fixture(fixtureMode);
  const room = current.window.ShokkerVerdictRoom.create(current.options);
  const next = clock();
  completeChecks(room, next, mode);
  room.lockWording(DOCKET_ID, {
    ...human(next, "Human locked the exact scoped proposition."),
    verdictCode,
    wording: VERDICT_WORDING[verdictCode],
  });
  const decision = room.adjudicate(DOCKET_ID, {
    ...human(next, "Human selected the scoped local verdict."),
    verdictCode,
    ...adjudicationBinding(room),
  });
  return { ...current, decision, next, room };
}

test("a valid universal pack creates a frozen zero-verdict local ledger", () => {
  const current = fixture();
  const room = current.window.ShokkerVerdictRoom.create(current.options);
  const projection = plain(room.getPublicProjection(DOCKET_ID));
  const saved = plain(room.snapshot());

  assert.equal(current.window.ShokkerVerdictRoom.VERSION, "1.0.0");
  assert.equal(Object.isFrozen(room), true);
  assert.deepEqual(
    plain(current.window.ShokkerVerdictRoom.REQUIRED_CAPABILITIES),
    ["longitudinal-claim-ledger", "human-adjudication-ledger"],
  );
  assert.equal(
    room.context.vocabularyHash,
    hashCanonical(current.vocabulary),
    "The browser SHA-256 implementation must match Node for canonical JSON.",
  );
  assert.deepEqual(projection, {
    docketId: DOCKET_ID,
    state: "UNREVIEWED",
    revision: 1,
    verdictCode: null,
    formalLabel: null,
    comedyLabel: null,
    reviewedWording: null,
    decisionHash: null,
    localHumanAttestation: false,
    identityVerified: false,
    speaker: null,
    speakerInferred: false,
    causalityClaimed: false,
    creatorCertified: false,
    rightsCleared: false,
    canonMutated: false,
  });
  assert.equal(saved.metrics.activeVerdicts, 0);
  assert.equal(saved.policy.identityVerificationAvailable, false);
  assert.equal(saved.policy.serverPersistenceAvailable, false);
  assert.doesNotMatch(room.exportJSON(), /CALL UPHELD|CALL OVERTURNED/);
});

test("all twelve human checks gate one scoped comedy verdict", () => {
  const current = fixture();
  const room = current.window.ShokkerVerdictRoom.create(current.options);
  const next = clock();
  const checks = completeChecks(room, next, "supported");

  assert.equal(checks.length, 11);
  assert.equal(room.getDocket(DOCKET_ID).review.state, "EVIDENCE_CHECKED");
  assert.equal(room.getChecks(DOCKET_ID).length, 11);

  room.lockWording(DOCKET_ID, {
    ...human(next),
    verdictCode: "SUPPORTED",
    wording: VERDICT_WORDING.SUPPORTED,
  });
  assert.equal(room.getDocket(DOCKET_ID).review.state, "WORDING_CHECKED");
  assert.equal(room.getChecks(DOCKET_ID).length, 12);

  const decision = room.adjudicate(DOCKET_ID, {
    ...human(next),
    verdictCode: "SUPPORTED",
    ...adjudicationBinding(room),
  });
  const projection = plain(room.getPublicProjection(DOCKET_ID));
  const reduced = plain(room.getPublicProjection(DOCKET_ID, {
    reducedProfanity: true,
  }));

  assert.equal(decision.after.state, "ADJUDICATED");
  assert.equal(decision.before.state, "WORDING_CHECKED");
  assert.match(decision.eventHash, /^sha256:[a-f0-9]{64}$/);
  assert.equal(projection.verdictCode, "SUPPORTED");
  assert.equal(
    projection.formalLabel,
    "SUPPORTED WITHIN REVIEWED SCOPE",
  );
  assert.equal(projection.comedyLabel, "CALLED THAT SHIT.");
  assert.equal(reduced.comedyLabel, "CALLED THAT [BLEEP].");
  assert.equal(projection.identityVerified, false);
  assert.equal(projection.speaker, null);
  assert.equal(projection.causalityClaimed, false);
  assert.equal(room.metrics.activeVerdicts, 1);
  assert.equal(room.metrics.callerAttestedHumanEvents, 13);
  assert.equal(room.metrics.identityVerifiedHumanEvents, 0);
});

test("the three exact codes follow relied-on evidence and caller labels never enter", () => {
  const supported = adjudicatedFixture("SUPPORTED", "supported");
  const contradicted = adjudicatedFixture(
    "CONTRADICTED",
    "contradicted",
  );
  const mixed = adjudicatedFixture("MIXED", "mixed");

  assert.equal(
    supported.room.getPublicProjection(DOCKET_ID).comedyLabel,
    "CALLED THAT SHIT.",
  );
  assert.equal(
    contradicted.room.getPublicProjection(DOCKET_ID).comedyLabel,
    "AGED LIKE ROADKILL.",
  );
  assert.equal(
    mixed.room.getPublicProjection(DOCKET_ID).comedyLabel,
    "HALF PROPHET. HALF JACKASS.",
  );

  const invalid = fixture();
  const room = invalid.window.ShokkerVerdictRoom.create(invalid.options);
  const next = clock();
  completeChecks(room, next, "supported");
  room.lockWording(DOCKET_ID, {
    ...human(next),
    verdictCode: "MIXED",
    wording: VERDICT_WORDING.MIXED,
  });
  assert.throws(
    () => room.adjudicate(DOCKET_ID, {
      ...human(next),
      verdictCode: "MIXED",
      ...adjudicationBinding(room),
    }),
    (error) => error.code === "VERDICT_EVIDENCE_INVALID",
  );
  assert.throws(
    () => room.adjudicate(DOCKET_ID, {
      ...human(next),
      verdictCode: "SUPPORTED",
      comedyLabel: "I MADE THIS UP",
      ...adjudicationBinding(room),
    }),
    (error) => error.code === "UNKNOWN_FIELD",
  );
});

test("adjudication binds the exact revision, wording lock, and complete check chain", () => {
  const current = fixture();
  const room = current.window.ShokkerVerdictRoom.create(current.options);
  const next = clock();
  completeChecks(room, next, "supported");
  room.lockWording(DOCKET_ID, {
    ...human(next),
    verdictCode: "SUPPORTED",
    wording: VERDICT_WORDING.SUPPORTED,
  });
  const binding = adjudicationBinding(room);
  const attempts = [
    [{
      ...binding,
      expectedRevision: binding.expectedRevision + 1,
    }, "ADJUDICATION_BINDING_INVALID"],
    [{
      ...binding,
      wording: `${binding.wording} Changed.`,
    }, "WORDING_MISMATCH"],
    [{
      ...binding,
      wordingEventId: "verdict-event:forged-wording",
    }, "ADJUDICATION_BINDING_INVALID"],
    [{
      ...binding,
      checkEventIds: binding.checkEventIds.slice().reverse(),
    }, "ADJUDICATION_BINDING_INVALID"],
  ];
  for (const [attemptedBinding, expectedCode] of attempts) {
    assert.throws(
      () => room.adjudicate(DOCKET_ID, {
        ...human(next),
        verdictCode: "SUPPORTED",
        ...attemptedBinding,
      }),
      (error) => error.code === expectedCode,
    );
  }
  const decision = room.adjudicate(DOCKET_ID, {
    ...human(next),
    verdictCode: "SUPPORTED",
    ...binding,
  });
  assert.equal(decision.payload.expectedRevision, 1);
  assert.equal(decision.payload.wording, binding.wording);
  assert.equal(decision.payload.wordingEventId, binding.wordingEventId);
  assert.deepEqual(
    plain(decision.payload.checkEventIds),
    binding.checkEventIds,
  );

  const codeBound = fixture();
  const codeBoundRoom = codeBound.window.ShokkerVerdictRoom.create(
    codeBound.options,
  );
  const codeClock = clock();
  completeChecks(codeBoundRoom, codeClock, "mixed");
  codeBoundRoom.lockWording(DOCKET_ID, {
    ...human(codeClock),
    verdictCode: "SUPPORTED",
    wording: VERDICT_WORDING.SUPPORTED,
  });
  assert.throws(
    () => codeBoundRoom.adjudicate(DOCKET_ID, {
      ...human(codeClock),
      verdictCode: "MIXED",
      ...adjudicationBinding(codeBoundRoom),
    }),
    (error) => error.code === "WORDING_MISMATCH",
  );
});

test("review shortcuts, missing attestation, duplicate checks, and unsafe wording fail closed", () => {
  const current = fixture();
  const room = current.window.ShokkerVerdictRoom.create(current.options);
  const next = clock();

  assert.throws(
    () => room.adjudicate(DOCKET_ID, {
      ...human(next),
      verdictCode: "SUPPORTED",
    }),
    (error) => error.code === "ADJUDICATION_BINDING_INVALID",
  );
  assert.throws(
    () => room.recordCheck(DOCKET_ID, {
      at: next(),
      reviewer: { role: "editor" },
      notes: "No caller human attestation.",
      code: "CANONICAL_PACKET",
      status: "PASS",
    }),
    (error) => error.code === "HUMAN_ATTESTATION_REQUIRED",
  );
  assert.throws(
    () => room.recordCheck(DOCKET_ID, {
      at: next(),
      reviewer: { role: "GPT-5 reviewer", humanAttested: true },
      notes: "Automation cannot make this local human decision.",
      code: "CANONICAL_PACKET",
      status: "PASS",
    }),
    (error) => error.code === "HUMAN_ATTESTATION_CONFLICT",
  );
  for (const role of [
    "A.I. assisted editor",
    "ChatGPT reviewer",
    "Open AI local judge",
    "Co-pilot operator",
    "L.L.M. adjudicator",
    "ML reviewer",
    "neural-network reviewer",
    "C\u200bl\u200ba\u200bu\u200bd\u200be reviewer",
  ]) {
    assert.throws(
      () => room.recordCheck(DOCKET_ID, {
        at: next(),
        reviewer: { role, humanAttested: true },
        notes: "This automation disclosure conflicts with attestation.",
        code: "CANONICAL_PACKET",
        status: "PASS",
      }),
      (error) => error.code === "HUMAN_ATTESTATION_CONFLICT",
      role,
    );
  }
  assert.throws(
    () => room.recordCheck(DOCKET_ID, {
      at: next(),
      reviewer: {
        role: "editor",
        name: "Chat GPT helper",
        humanAttested: true,
      },
      notes: "Reviewer name also discloses automation.",
      code: "CANONICAL_PACKET",
      status: "PASS",
    }),
    (error) => error.code === "HUMAN_ATTESTATION_CONFLICT",
  );

  room.recordCheck(DOCKET_ID, {
    ...human(next),
    code: "CANONICAL_PACKET",
    status: "PASS",
  });
  assert.throws(
    () => room.recordCheck(DOCKET_ID, {
      ...human(next),
      code: "CANONICAL_PACKET",
      status: "PASS",
    }),
    (error) => error.code === "CHECK_DUPLICATE",
  );
  assert.throws(
    () => room.recordCheck(DOCKET_ID, {
      ...human(next),
      code: "CONTRADICTION_SWEEP",
      status: "PASS",
    }),
    (error) => error.code === "EVIDENCE_DISPOSITION_REQUIRED",
  );

  const wording = fixture();
  const wordingRoom = wording.window.ShokkerVerdictRoom.create(
    wording.options,
  );
  const wordingClock = clock();
  completeChecks(wordingRoom, wordingClock);
  for (const unsafe of [
    "Mike predicted this and was definitely right.",
    "The prediction caused the later reaction to happen.",
    "Creator certified and promoted to canon.",
    "According to Mike, the bounded prediction was correct.",
    "Mike's prediction matches the bounded later evidence.",
    "The earlier expectation led to the later reaction.",
    "The same speaker returned to the prediction later.",
    "He knew the later evidence would support the expectation.",
    "The outcome happened as a result of the earlier call.",
    "J's call matches the bounded later evidence.",
    "J’s prediction matches the bounded later evidence.",
    "Mike was right about the bounded later evidence.",
    "The earlier expectation brought about the later reaction.",
    "The creator has rights clearance for this conclusion.",
    "This is licensed as an official conclusion.",
    "<img src=x onerror=alert(1)>",
  ]) {
    assert.throws(
      () => wordingRoom.lockWording(DOCKET_ID, {
        ...human(wordingClock),
        verdictCode: "SUPPORTED",
        wording: unsafe,
      }),
      (error) => error.code === "WORDING_UNSAFE",
      unsafe,
    );
  }
  for (const mismatched of [
    "Mike—predicted this and the later evidence supported the expectation.",
    "M1ke predicted this; later evidence proved the expectation correct.",
    "The channel endorses this conclusion as official canon.",
    "Officially sanctioned by the show runners as the correct result.",
  ]) {
    assert.throws(
      () => wordingRoom.lockWording(DOCKET_ID, {
        ...human(wordingClock),
        verdictCode: "SUPPORTED",
        wording: mismatched,
      }),
      (error) => [
        "WORDING_UNSAFE",
        "WORDING_MISMATCH",
      ].includes(error.code),
      mismatched,
    );
  }
  for (const role of [
    "robot reviewer",
    "software adjudicator",
    "computer-generated reviewer",
  ]) {
    assert.throws(
      () => wordingRoom.lockWording(DOCKET_ID, {
        ...human(wordingClock),
        reviewer: {
          role,
          name: "Local Reviewer",
          id: "reviewer-local",
          humanAttested: true,
        },
        verdictCode: "SUPPORTED",
        wording: VERDICT_WORDING.SUPPORTED,
      }),
      (error) => error.code === "HUMAN_ATTESTATION_CONFLICT",
      role,
    );
  }
  assert.equal(
    wordingRoom.getPublicProjection(DOCKET_ID).verdictCode,
    null,
  );
});

test("undo and revoke append history, suppress copy, and force a new revision", () => {
  const current = fixture();
  const room = current.window.ShokkerVerdictRoom.create(current.options);
  const next = clock();
  const first = room.recordCheck(DOCKET_ID, {
    ...human(next),
    code: "CANONICAL_PACKET",
    status: "PASS",
  });
  const undone = room.undo(DOCKET_ID, {
    ...human(next, "Human undid the latest local check without deleting it."),
    eventId: first.id,
  });

  assert.equal(undone.type, "UNDO");
  assert.equal(undone.after.state, "UNREVIEWED");
  assert.equal(room.getChecks(DOCKET_ID).length, 0);
  assert.equal(room.getLedger(DOCKET_ID).length, 2);

  completeChecks(room, next, "mixed");
  room.lockWording(DOCKET_ID, {
    ...human(next),
    verdictCode: "MIXED",
    wording: VERDICT_WORDING.MIXED,
  });
  const decision = room.adjudicate(DOCKET_ID, {
    ...human(next),
    verdictCode: "MIXED",
    ...adjudicationBinding(room),
  });
  assert.throws(
    () => room.undo(DOCKET_ID, {
      ...human(next),
      eventId: decision.id,
    }),
    (error) => error.code === "UNDO_INVALID",
  );

  const revoked = room.revoke(DOCKET_ID, {
    ...human(next, "Human revoked the local adjudication."),
    decisionId: decision.id,
  });
  assert.equal(revoked.after.state, "REVOKED");
  assert.equal(room.getPublicProjection(DOCKET_ID).verdictCode, null);
  assert.equal(room.getPublicProjection(DOCKET_ID).comedyLabel, null);

  room.recordCheck(DOCKET_ID, {
    ...human(next, "Human started a fresh revision."),
    code: "CANONICAL_PACKET",
    status: "PASS",
  });
  const reopened = room.getDocket(DOCKET_ID).review;
  assert.equal(reopened.revision, 2);
  assert.equal(reopened.state, "UNREVIEWED");
  assert.equal(reopened.checks.length, 1);
  assert.equal(room.getLedger(DOCKET_ID).some(
    (event) => event.type === "REVOKE",
  ), true);
});

test("REJECTED is terminal and cannot be reopened through generic undo", () => {
  const current = fixture();
  const room = current.window.ShokkerVerdictRoom.create(current.options);
  const next = clock();
  const rejection = room.reject(DOCKET_ID, {
    ...human(next, "Human rejected this exact review revision."),
    reasonCode: "INSUFFICIENT_EVIDENCE",
  });

  assert.equal(rejection.after.state, "REJECTED");
  assert.throws(
    () => room.undo(DOCKET_ID, {
      ...human(next, "A rejection cannot be erased through generic undo."),
      eventId: rejection.id,
    }),
    (error) => error.code === "UNDO_INVALID",
  );
  assert.throws(
    () => room.markNeedsContext(DOCKET_ID, human(next)),
    (error) => error.code === "TRANSITION_INVALID",
  );
  assert.throws(
    () => room.reject(DOCKET_ID, {
      ...human(next),
      reasonCode: "DUPLICATE",
    }),
    (error) => error.code === "TRANSITION_INVALID",
  );
  assert.equal(room.getDocket(DOCKET_ID).review.state, "REJECTED");
  assert.equal(room.getLedger(DOCKET_ID).length, 1);
});

test("JSON and Markdown are deterministic and exact restore replays every event", () => {
  const first = adjudicatedFixture("MIXED", "mixed");
  const second = adjudicatedFixture("MIXED", "mixed");
  const json = first.room.exportJSON();
  const markdown = first.room.exportMarkdown();
  const restored = first.window.ShokkerVerdictRoom.restore(
    JSON.parse(json),
    first.options,
  );
  const imported = first.window.ShokkerVerdictRoom.importJSON(
    json,
    first.options,
  );

  assert.equal(first.room.exportJSON(), second.room.exportJSON());
  assert.equal(restored.exportJSON(), json);
  assert.equal(imported.exportJSON(), json);
  assert.equal(restored.exportMarkdown(), markdown);
  assert.match(markdown, /HALF PROPHET\\?\. HALF JACKASS\\?\./);
  assert.match(markdown, /no identity verification, server persistence/i);
  assert.equal(json.includes("generatedAt"), false);
  assert.equal(json.includes("rawCaption"), false);
  const events = plain(first.room.getLedger());
  events.forEach((event, index) => {
    assert.equal(
      event.previousEventHash,
      index ? events[index - 1].eventHash : "",
    );
  });
});

test("Markdown escapes headings, fences hostile text, and exports the full audit record", () => {
  const current = fixture();
  current.options.session.name =
    "## Forged heading <script>alert(1)</script> [jump](#bad)";
  current.packet.docket.title =
    "Docket <img src=x> [forged](#heading) # title";
  const room = current.window.ShokkerVerdictRoom.create(current.options);
  const next = clock();
  room.reject(DOCKET_ID, {
    ...human(
      next,
      "Human note with ``` fence and ## forged heading <script>.",
    ),
    reasonCode: "OUT_OF_SCOPE",
  });
  const markdown = room.exportMarkdown();

  assert.match(markdown, /&lt;script&gt;alert\\\(1\\\)&lt;\/script&gt;/);
  assert.match(markdown, /Docket &lt;img src=x&gt;/);
  assert.doesNotMatch(markdown, /^## Forged heading/m);
  assert.match(markdown, /## Session policy and canonical binding/);
  assert.match(markdown, /## Docket review register/);
  assert.match(markdown, /#### Canonical bounded receipts/);
  assert.match(markdown, /## Complete append-only event ledger/);
  assert.match(markdown, /"state": "REJECTED"/);
  assert.match(markdown, /"previousDocketEventHash": ""/);
  assert.match(markdown, /"boundary": \{/);
  assert.match(markdown, /````json/);
  assert.match(markdown, /\[official source\]\(https:\/\/www\.youtube\.com/);
});

test("ordinary and rehashed semantic tampering both fail restore", () => {
  const current = adjudicatedFixture("SUPPORTED", "supported");
  const ordinary = plain(current.room.snapshot());
  ordinary.events[0].notes = "Changed without updating the proof.";
  assert.throws(
    () => current.window.ShokkerVerdictRoom.restore(
      ordinary,
      current.options,
    ),
    (error) => error.code === "SNAPSHOT_TAMPERED",
  );

  const semantic = plain(current.room.snapshot());
  const decision = semantic.events.find(
    (event) => event.type === "ADJUDICATE",
  );
  decision.boundary.speakerInferred = true;
  rehashEvent(decision);
  rehashSnapshot(semantic);
  assert.throws(
    () => current.window.ShokkerVerdictRoom.restore(
      semantic,
      current.options,
    ),
    (error) => error.code === "SNAPSHOT_TAMPERED",
  );

  const coercionFixture = fixture();
  const coercionRoom = coercionFixture.window.ShokkerVerdictRoom.create(
    coercionFixture.options,
  );
  const coercionClock = clock();
  coercionRoom.recordCheck(DOCKET_ID, {
    ...human(coercionClock),
    code: "CANONICAL_PACKET",
    status: "PASS",
  });
  const coercion = plain(coercionRoom.snapshot());
  coercion.events[0].at = "0";
  rehashEvent(coercion.events[0]);
  rehashSnapshot(coercion);
  assert.throws(
    () => coercionFixture.window.ShokkerVerdictRoom.restore(
      coercion,
      coercionFixture.options,
    ),
    (error) => error.code === "SNAPSHOT_TAMPERED",
  );
});

test("changed canonical packets suppress old verdicts and reject restore", () => {
  const current = adjudicatedFixture("SUPPORTED", "supported");
  const saved = plain(current.room.snapshot());
  current.packet.response.candidate.excerpt += " changed";

  const projection = plain(current.room.getPublicProjection(DOCKET_ID));
  assert.equal(projection.state, "STALE_INPUT");
  assert.equal(projection.verdictCode, null);
  assert.equal(projection.comedyLabel, null);
  assert.throws(
    () => current.room.snapshot(),
    (error) => error.code === "STALE_INPUT",
  );
  assert.throws(
    () => current.window.ShokkerVerdictRoom.restore(saved, current.options),
    (error) => error.code === "STALE_INPUT",
  );
  assert.throws(
    () => current.window.ShokkerVerdictRoom.create({
      ...current.options,
      packet: saved,
    }),
    (error) => error.code === "UNKNOWN_FIELD",
  );
});

test("capability, import, note, and hostile-key boundaries are fail closed", () => {
  const missing = fixture("wwam", false);
  assert.throws(
    () => missing.window.ShokkerVerdictRoom.create(missing.options),
    (error) => error.code === "CAPABILITY_REQUIRED",
  );

  const current = fixture();
  const room = current.window.ShokkerVerdictRoom.create(current.options);
  const next = clock();
  assert.throws(
    () => room.recordCheck(DOCKET_ID, {
      ...human(next, "x".repeat(4_001)),
      code: "CANONICAL_PACKET",
      status: "PASS",
    }),
    (error) => error.code === "STRING_LIMIT",
  );
  assert.throws(
    () => current.window.ShokkerVerdictRoom.importJSON(
      `"${"x".repeat(2_000_001)}"`,
      current.options,
    ),
    (error) => error.code === "IMPORT_LIMIT",
  );
  assert.throws(
    () => current.window.ShokkerVerdictRoom.importJSON(
      '{"__proto__":{"polluted":true}}',
      current.options,
    ),
    (error) => error.code === "UNSAFE_KEY",
  );
  assert.equal({}.polluted, undefined);
});

test("ChannelPack owns labels and only the canonical docket factory may supply packets", () => {
  const current = fixture();
  const rogueEngine = Object.freeze({
    inspect: () => clone(current.packet),
    verify: () => ({ ok: true }),
    serialize: (value) => stableJson(value),
  });
  assert.throws(
    () => current.window.ShokkerVerdictRoom.create({
      ...current.options,
      verdictVocabulary: {
        SUPPORTED: {
          formal: "CALLER SAYS TRUE",
          comedy: "CALLER MADE THIS UP",
          bleep: "CALLER MADE THIS UP",
        },
      },
    }),
    (error) => error.code === "UNKNOWN_FIELD",
  );
  assert.throws(
    () => current.window.ShokkerVerdictRoom.create({
      ...current.options,
      docketEngine: rogueEngine,
    }),
    (error) => error.code === "UNKNOWN_FIELD",
  );

  const inheritedPack = clone(current.pack);
  const inheritedIdentity = Object.create({
    id: current.pack.identity.id,
  });
  Object.entries(current.pack.identity).forEach(([key, value]) => {
    if (key !== "id") inheritedIdentity[key] = value;
  });
  inheritedPack.identity = inheritedIdentity;
  assert.throws(
    () => current.window.ShokkerVerdictRoom.create({
      ...current.options,
      channelPack: inheritedPack,
    }),
    (error) => [
      "INHERITED_FIELD",
      "UNSAFE_PROTOTYPE",
      "MUTABLE_CHANNEL_PACK",
    ].includes(error.code),
  );

  const unfrozenFactory = fixture();
  let rogueFactoryCalls = 0;
  unfrozenFactory.window.ShokkerLongitudinalDocket = {
    create: () => {
      rogueFactoryCalls += 1;
      return rogueEngine;
    },
  };
  const protectedRoom = unfrozenFactory.window.ShokkerVerdictRoom.create(
    unfrozenFactory.options,
  );
  assert.equal(protectedRoom.getDocket(DOCKET_ID).id, DOCKET_ID);
  assert.equal(rogueFactoryCalls, 0);
});

test("accessors, inherited action fields, and provider packet getters cannot cross the review boundary", () => {
  const current = fixture();

  for (const nested of [false, true]) {
    const forgedPack = clone(current.pack);
    if (nested) {
      Object.defineProperty(
        forgedPack.adjudicationVocabulary.SUPPORTED,
        "formal",
        {
          enumerable: true,
          configurable: true,
          get() {
            return "CALLER-FORGED FORMAL LABEL";
          },
        },
      );
    } else {
      const official = forgedPack.adjudicationVocabulary;
      Object.defineProperty(forgedPack, "adjudicationVocabulary", {
        enumerable: true,
        configurable: true,
        get() {
          return official;
        },
      });
    }
    freezeOwnDataTree(forgedPack);
    assert.throws(
      () => current.window.ShokkerVerdictRoom.create({
        ...current.options,
        channelPack: forgedPack,
      }),
      (error) => error.code === "UNSAFE_DESCRIPTOR",
    );
  }

  const room = current.window.ShokkerVerdictRoom.create(current.options);
  const next = clock();
  const inherited = Object.create({
    at: next(),
    reviewer: human(next).reviewer,
    notes: "Inherited human review fields must never count.",
  });
  inherited.code = "CANONICAL_PACKET";
  inherited.status = "PASS";
  assert.throws(
    () => room.recordCheck(DOCKET_ID, inherited),
    (error) => [
      "INHERITED_FIELD",
      "UNSAFE_PROTOTYPE",
    ].includes(error.code),
  );

  const providerFixture = fixture();
  const officialPacket = clone(providerFixture.packet);
  const officialSerialized = stableJson(officialPacket);
  const forgedPacket = clone(officialPacket);
  Object.defineProperty(forgedPacket.forecast.candidate, "excerpt", {
    enumerable: true,
    configurable: true,
    get() {
      return "FORGED REVIEW EXCERPT NOT IN PACKET HASH";
    },
  });
  providerFixture.window.__VERDICT_TEST_ENGINE_PROVIDER = () =>
    Object.freeze({
      inspect: () => forgedPacket,
      verify: () => ({ ok: true }),
      serialize: () => officialSerialized,
    });
  const protectedRoom = providerFixture.window.ShokkerVerdictRoom.create(
    providerFixture.options,
  );
  const protectedDocket = plain(protectedRoom.getDocket(DOCKET_ID));
  assert.equal(
    protectedDocket.requiredReceipts[0].excerpt,
    officialPacket.forecast.candidate.excerpt,
  );
  assert.doesNotMatch(
    JSON.stringify(protectedDocket),
    /FORGED REVIEW EXCERPT/,
  );
});

test("the identical engine adjudicates a neutral racing pack with no WWAM leakage", () => {
  const current = adjudicatedFixture(
    "SUPPORTED",
    "supported",
    "racing",
  );
  const projection = plain(current.room.getPublicProjection(DOCKET_ID));
  const output = [
    current.room.exportJSON(),
    current.room.exportMarkdown(),
    stableJson(projection),
  ].join("\n");

  assert.equal(current.pack.identity.id, "sample-racing");
  assert.equal(
    projection.formalLabel,
    "SUPPORTED // CALL UPHELD",
  );
  assert.equal(
    projection.comedyLabel,
    "THE REPLAY BACKS THE CALL.",
  );
  assert.equal(current.window.ShokkerChannelPack.validate(current.pack).valid, true);
  assert.doesNotMatch(
    output,
    /WWAM|HALLOWEEN|SCREAM|CALLED THAT SHIT|ROADKILL|JACKASS/i,
  );
  assert.equal(projection.speaker, null);
  assert.equal(projection.causalityClaimed, false);
  assert.equal(projection.creatorCertified, false);
});
