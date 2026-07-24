import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(here, "..");
const demo = path.join(root, "public", "demo");
const captionRoot = path.join(root, "source-cache", "captions");
const runtimeFiles = [
  "wwam-channel-dna.js",
  "wwam-channel-pack-adapter.js",
  "channel-pack-contract.js",
  "longitudinal-docket-data.js",
  "longitudinal-docket-engine.js",
];

function load(files = runtimeFiles) {
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
      return output.slice().sort((left, right) => (
        compareText(left.id, right.id)
      ));
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

function refingerprintPacket(packet) {
  packet.fingerprint = packetFingerprint(packet);
  return packet;
}

function fixture() {
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

function issueCodes(error) {
  return new Set((error && error.issues || []).map((entry) => entry.code));
}

function assertDataRejected(window, channelPack, data, message) {
  assert.throws(
    () => window.ShokkerLongitudinalDocket.create({
      channelPack,
      data: refingerprint(data),
    }),
    (error) => (
      error &&
      error.code === "LONGITUDINAL_DOCKET_REJECTED" &&
      Array.isArray(error.issues) &&
      error.issues.length > 0
    ),
    message,
  );
}

function normalizedWords(value) {
  return String(value || "")
    .normalize("NFKD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/â€™|â€˜/g, "'")
    .replace(/\[\s*(?:_+\s*_*|bleep)\s*\]/gi, " bleep ")
    .toLowerCase()
    .match(/[a-z0-9]+(?:'[a-z0-9]+)?/g) || [];
}

function captionCues(sourceId) {
  const payload = JSON.parse(
    fs.readFileSync(path.join(captionRoot, `${sourceId}.json`), "utf8"),
  );
  return (payload.events || []).map((event) => ({
    start: Number(event.tStartMs || 0) / 1000,
    duration: Number(event.dDurationMs || 0) / 1000,
    words: normalizedWords(
      (event.segs || []).map((segment) => segment.utf8 || "").join(""),
    ),
  })).filter((cue) => cue.words.length > 0);
}

function excerptStart(sourceId, windowValue, excerpt) {
  const selected = captionCues(sourceId).filter((cue) => (
    cue.start <= Number(windowValue.to) &&
    cue.start + Math.max(0, cue.duration) >= Number(windowValue.from)
  ));
  const words = [];
  const starts = [];
  for (const cue of selected) {
    for (const word of cue.words) {
      words.push(word);
      starts.push(cue.start);
    }
  }
  const needle = normalizedWords(excerpt);
  for (let index = 0; index <= words.length - needle.length; index += 1) {
    if (needle.every((word, offset) => words[index + offset] === word)) {
      return starts[index];
    }
  }
  return null;
}

test("re-fingerprinting cannot turn an arbitrary object into a verified export", () => {
  const { engine } = fixture();
  const packet = clone(
    engine.inspect("docket:scream-7-commentary-plan-open"),
  );
  packet.title = "THE PROMISE WAS DEFINITELY KEPT";
  packet.outcome = "PROVEN TRUE";
  packet.speakerName = "Mike";
  packet.payload = "raw caption words ".repeat(4_000);
  refingerprintPacket(packet);

  const report = plain(engine.verify(packet));
  assert.equal(
    report.ok,
    false,
    "Unknown truth, speaker, and payload fields must fail closed even when an attacker recomputes the public change-detector fingerprint.",
  );
  assert.ok(report.errors.length > 0);
  assert.throws(
    () => engine.serialize(packet),
    (error) => error && error.code === "LONGITUDINAL_DOCKET_REJECTED",
  );
});

test("truth language cannot hide in labels, titles, basis, or blocker fields", () => {
  const { window, channelPack, data } = fixture();
  const cases = [
    {
      label: "unresolved label",
      mutate(copy) {
        copy.labels.unresolved = "PROVEN TRUE";
      },
    },
    {
      label: "docket title",
      mutate(copy) {
        copy.dockets[0].title = "THEY CALLED IT EXACTLY";
      },
    },
    {
      label: "pair basis",
      mutate(copy) {
        copy.dockets[0].pairBasis.push("prediction-proven-correct");
      },
    },
    {
      label: "resolution blocker",
      mutate(copy) {
        copy.dockets[0].resolutionBlockedBy.push("prediction-confirmed");
      },
    },
  ];

  for (const entry of cases) {
    const copy = clone(data);
    entry.mutate(copy);
    assertDataRejected(
      window,
      channelPack,
      copy,
      `${entry.label} must not smuggle a public verdict`,
    );
  }
});

test("prototype-sensitive keys fail closed recursively in data and packets", () => {
  const { window, channelPack, data, engine } = fixture();

  for (const dangerousKey of ["__proto__", "constructor", "prototype"]) {
    const copy = clone(data);
    Object.defineProperty(copy.provenance, dangerousKey, {
      value: { outcome: "PREDICTION VINDICATED" },
      enumerable: true,
      configurable: true,
      writable: true,
    });
    refingerprint(copy);
    assert.throws(
      () => window.ShokkerLongitudinalDocket.create({
        channelPack,
        data: copy,
      }),
      (error) => issueCodes(error).has("prototype-key-firewall"),
      `${dangerousKey} must be rejected even when nested and re-fingerprinted`,
    );
  }

  const packet = clone(
    engine.inspect("docket:scream-7-commentary-plan-open"),
  );
  Object.defineProperty(packet.response.candidate, "__proto__", {
    value: {
      outcome: "PREDICTION VINDICATED",
      speakerName: "Mike",
    },
    enumerable: true,
    configurable: true,
    writable: true,
  });
  const report = plain(engine.verify(packet));
  assert.equal(report.ok, false);
  assert.ok(
    report.errors.some((entry) => entry.code === "prototype-key-firewall"),
  );
});

test("portable subject grounding cannot be injected through private window cues", () => {
  const { window, channelPack, data } = fixture();
  const claim = data.claims[0];
  const response = data.responses[0];
  const docket = data.dockets.find(
    (entry) => entry.claimId === claim.id && entry.responseId === response.id,
  );

  data.subjects.push({
    id: "film:totally-unrelated",
    label: "Totally Unrelated",
    type: "film",
  });
  for (const candidate of [claim, response]) {
    candidate.subjects.push("film:totally-unrelated");
    candidate.subjectBindings.push({
      subjectId: "film:totally-unrelated",
      basis: "window-cue",
      cue: "Totally Unrelated",
    });
    candidate.windowCueTerms = ["Totally Unrelated"];
  }
  docket.subjects.push("film:totally-unrelated");

  assert.throws(
    () => window.ShokkerLongitudinalDocket.create({
      channelPack,
      data: refingerprint(data),
    }),
    (error) => (
      issueCodes(error).has("unsupported-subject-binding") &&
      issueCodes(error).has("unknown-field")
    ),
    "Portable candidates must ground every subject in their public excerpt or registered source title.",
  );
});

test("finality synonyms such as vindicated and fulfilled hit the truth firewall", () => {
  const { window, channelPack, data } = fixture();
  const cases = [
    ["label", (copy) => {
      copy.labels.product = "PREDICTION VINDICATED";
    }],
    ["title", (copy) => {
      copy.dockets[0].title = "THE PROMISE WAS FULFILLED";
    }],
  ];

  for (const [label, mutate] of cases) {
    const copy = clone(data);
    mutate(copy);
    assert.throws(
      () => window.ShokkerLongitudinalDocket.create({
        channelPack,
        data: refingerprint(copy),
      }),
      (error) => issueCodes(error).has("truth-language-firewall"),
      `${label} finality language must not become a machine verdict`,
    );
  }
});

test("every audited verdict paraphrase fails the deterministic title formula", () => {
  const { window, channelPack, data } = fixture();
  const verdictParaphrases = [
    "Prediction was spot on",
    "They called this",
    "It happened exactly",
    "The call aged perfectly",
    "This was dead-on",
    "They saw it coming",
    "The forecast hit",
    "The forecast paid off",
    "They were prophetic",
    "Bingo",
    "Predictions were spot-on",
    "They are calling this",
    "It happens exactly",
    "The calls aged perfectly",
    "This is dead on",
    "They had seen it coming",
    "The forecasts hit",
    "The forecast pays off",
    "They are prophets",
    "Bingo!",
  ];

  for (const title of verdictParaphrases) {
    const copy = clone(data);
    copy.dockets[0].title = title;
    assert.throws(
      () => window.ShokkerLongitudinalDocket.create({
        channelPack,
        data: refingerprint(copy),
      }),
      (error) => issueCodes(error).has("docket-title-vocabulary-mismatch"),
      `${title} must not enter the machine-authoritative title surface`,
    );
  }
});

test("channel, labels, subjects, and provenance are bound to trusted vocabularies", () => {
  const { window, channelPack, data } = fixture();
  const cases = [
    {
      code: "channel-pack-mismatch",
      mutate(copy) {
        copy.channel.label = "Prediction was spot on";
      },
    },
    {
      code: "longitudinal-vocabulary-mismatch",
      mutate(copy) {
        copy.labels.product = "Prediction was spot on";
      },
    },
    {
      code: "channel-pack-entity-mismatch",
      mutate(copy) {
        copy.subjects[0].label = "Prediction was spot on";
      },
    },
    ...["generator", "privateInput", "publicInput", "integrityNote"].map(
      (key) => ({
        code: "provenance-vocabulary-mismatch",
        mutate(copy) {
          copy.provenance[key] = "Prediction was spot on";
        },
      }),
    ),
  ];

  for (const entry of cases) {
    const copy = clone(data);
    entry.mutate(copy);
    assert.throws(
      () => window.ShokkerLongitudinalDocket.create({
        channelPack,
        data: refingerprint(copy),
      }),
      (error) => issueCodes(error).has(entry.code),
    );
  }
});

test("subject binding order is semantically canonical across create and verify", () => {
  const { window, channelPack, data, engine } = fixture();
  const reordered = clone(data);
  for (const candidate of [...reordered.claims, ...reordered.responses]) {
    candidate.subjectBindings.reverse();
  }
  refingerprint(reordered);

  const other = window.ShokkerLongitudinalDocket.create({
    channelPack,
    data: reordered,
  });
  assert.equal(other.verify().ok, true);
  assert.equal(other.serialize(), engine.serialize());
});

test("sources and subject types must exist in the bound ChannelPack taxonomy", () => {
  const { window, channelPack, data } = fixture();

  const inventedLane = clone(data);
  inventedLane.sources[0].lane = "invented-lane";
  assert.throws(
    () => window.ShokkerLongitudinalDocket.create({
      channelPack,
      data: refingerprint(inventedLane),
    }),
    (error) => issueCodes(error).has("channel-pack-source-lane-mismatch"),
  );

  const inventedType = clone(data);
  inventedType.subjects[0].type = "invented-type";
  assert.throws(
    () => window.ShokkerLongitudinalDocket.create({
      channelPack,
      data: refingerprint(inventedType),
    }),
    (error) => issueCodes(error).has("channel-pack-taxonomy-mismatch"),
  );
});

test("public packets omit internal subject-binding and window-cue multipliers", () => {
  const { engine } = fixture();
  const inspection = plain(
    engine.inspect("docket:scream-7-commentary-plan-open"),
  );
  const exported = JSON.parse(engine.serialize());

  for (const packet of [inspection, exported]) {
    const serialized = JSON.stringify(packet);
    assert.doesNotMatch(serialized, /"subjectBindings"\s*:/);
    assert.doesNotMatch(serialized, /"windowCueTerms"\s*:/);
    assert.doesNotMatch(serialized, /"contentMode"\s*:/);
    assert.doesNotMatch(serialized, /"publicInput"\s*:/);
    assert.doesNotMatch(serialized, /"integrityNote"\s*:/);
    assert.equal(engine.verify(packet).ok, true);
  }
});

test("one claim/response pair cannot be cloned into multiple counted dockets", () => {
  const { window, channelPack, data } = fixture();
  const duplicate = clone(data.dockets[0]);
  duplicate.id = "docket:duplicate-count-inflation";
  data.dockets.push(duplicate);

  assertDataRejected(
    window,
    channelPack,
    data,
    "The same claim/response coordinates must have one canonical docket.",
  );
});

test("timestamps and evidence windows require strict numeric types", () => {
  const { window, channelPack, data } = fixture();
  const cases = [
    {
      label: "boolean timestamp",
      mutate(copy) {
        const candidate = copy.claims[0];
        candidate.t = false;
        candidate.url =
          `https://www.youtube.com/watch?v=${candidate.sourceId}&t=0s`;
        candidate.window = { from: 0, to: 1 };
      },
    },
    {
      label: "numeric-string timestamp",
      mutate(copy) {
        copy.claims[0].t = String(copy.claims[0].t);
      },
    },
    {
      label: "numeric-string evidence window",
      mutate(copy) {
        copy.claims[0].window.from = String(copy.claims[0].window.from);
        copy.claims[0].window.to = String(copy.claims[0].window.to);
      },
    },
  ];

  for (const entry of cases) {
    const copy = clone(data);
    entry.mutate(copy);
    assertDataRejected(
      window,
      channelPack,
      copy,
      `${entry.label} must not be coerced into evidence`,
    );
  }
});

test("declared forecast/response cue terms must be grounded in the excerpt", () => {
  const { window, channelPack, data } = fixture();
  data.claims[0].cueTerms = ["fabricated forecast cue"];

  assertDataRejected(
    window,
    channelPack,
    data,
    "A role label is not evidence when its cue is absent from the receipt.",
  );
});

test("shared IDs cannot attach an unrelated subject to both sides of a pair", () => {
  const { window, channelPack, data } = fixture();
  data.subjects.push({
    id: "film:totally-unrelated",
    label: "Totally Unrelated",
    type: "film",
  });
  data.claims[0].subjects.push("film:totally-unrelated");
  data.responses[0].subjects.push("film:totally-unrelated");
  data.dockets.find((entry) => (
    entry.claimId === data.claims[0].id &&
    entry.responseId === data.responses[0].id
  )).subjects.push("film:totally-unrelated");

  assertDataRejected(
    window,
    channelPack,
    data,
    "Set intersection alone must not manufacture subject scope.",
  );
});

test("trailer-audio and visual-outcome content cannot self-declare caption safety", () => {
  const { window, channelPack, data } = fixture();

  const trailer = clone(data);
  const trailerSource = trailer.sources.find(
    (source) => source.id === trailer.claims[0].sourceId,
  );
  trailerSource.contentMode = "trailer-reaction";
  trailerSource.rightsMode = "standard-caption-candidates";
  trailerSource.evidenceAccess = "short-caption-candidate";
  assertDataRejected(
    window,
    channelPack,
    trailer,
    "Trailer-reaction audio requires an explicit reviewed boundary, not a self-declared standard-caption mode.",
  );

  const visual = clone(data);
  const docket = visual.dockets.find(
    (entry) => entry.id === "docket:scream-vi-anticipation-to-reception",
  );
  const response = visual.responses.find(
    (entry) => entry.id === docket.responseId,
  );
  const visualSource = visual.sources.find(
    (source) => source.id === response.sourceId,
  );
  visualSource.contentMode = "visual-outcome";
  visualSource.rightsMode = "standard-caption-candidates";
  visualSource.evidenceAccess = "short-caption-candidate";
  docket.pairBasis.push("target-outcome-candidate");
  docket.requiresWholeWorkVisualReview = false;
  assertDataRejected(
    window,
    channelPack,
    visual,
    "A visual outcome cannot bypass whole-work review by changing its rights label.",
  );
});

test("machine pairs always retain explicit speaker-continuity blocks", () => {
  const { window, channelPack, data } = fixture();
  const docket = data.dockets.find(
    (entry) => entry.id === "docket:scream-vi-anticipation-to-reception",
  );
  docket.pairBasis = docket.pairBasis.filter(
    (entry) => entry !== "no-speaker-continuity-claim",
  );
  docket.resolutionBlockedBy = docket.resolutionBlockedBy.filter(
    (entry) => entry !== "speaker-not-diarized",
  );

  assertDataRejected(
    window,
    channelPack,
    data,
    "Null speaker fields alone do not prevent a two-source pair from implying identity continuity.",
  );
});

test("bounded excerpts cannot be multiplied into an unbounded public export", () => {
  const { window, channelPack, data } = fixture();
  const response = data.responses.find(
    (entry) => entry.id === "response:scream-vi-positive-reception",
  );
  response.additionalReceipts = Array.from({ length: 257 }, (_, index) => ({
    id: `receipt:bulk-${String(index).padStart(3, "0")}`,
    t: response.t,
    url: response.url,
    window: clone(response.window),
    excerpt: response.excerpt,
    excerptMode: response.excerptMode,
    cueTerms: clone(response.cueTerms),
  }));

  assertDataRejected(
    window,
    channelPack,
    data,
    "Per-excerpt word limits need a receipt-count or total-byte ceiling.",
  );
});

test("hostile collection sizes fail before quadratic browse/export work", () => {
  const { window, channelPack, data } = fixture();
  data.subjects.push(...Array.from({ length: 1_001 }, (_, index) => ({
    id: `topic:bulk-${String(index).padStart(4, "0")}`,
    label: `Bulk subject ${index}`,
    type: "topic",
  })));

  assertDataRejected(
    window,
    channelPack,
    data,
    "A public engine must impose explicit collection and serialized-byte budgets.",
  );
});

test("a missing ChannelPack validator cannot degrade into accepting a forged pack", () => {
  const window = load([
    "longitudinal-docket-data.js",
    "longitudinal-docket-engine.js",
  ]);
  const data = plain(window.WWAM_LONGITUDINAL_DOCKETS);
  const forgedPack = {
    identity: { id: "forged-channel" },
    fingerprint: "cp1-0000000000000000",
    evidencePolicy: {
      publicExcerptWords: 16,
      timestampRequired: true,
      sourceUrlRequired: true,
      noSpeakerGuessing: true,
      promotionRequiresHumanReview: true,
      preserveContradictions: true,
      machineOutputState: "quarantine",
    },
    capabilities: ["longitudinal-claim-ledger"],
  };
  data.channel.id = forgedPack.identity.id;
  data.channel.label = "Forged Channel";
  data.channel.packFingerprint = forgedPack.fingerprint;
  refingerprint(data);

  assert.throws(
    () => window.ShokkerLongitudinalDocket.create({
      channelPack: forgedPack,
      data,
    }),
    (error) => (
      error &&
      error.code === "LONGITUDINAL_DOCKET_REJECTED" &&
      (
        issueCodes(error).has("invalid-channel-pack") ||
        issueCodes(error).has("missing-channel-pack-validator")
      )
    ),
  );
});

test("caption-set integrity is recomputed from the registered source hashes", () => {
  const { window, channelPack, data } = fixture();
  data.sources[0].captionPayloadSha256 = `sha256:${"0".repeat(64)}`;

  assertDataRejected(
    window,
    channelPack,
    data,
    "A syntactically valid source hash must still invalidate the caption-set manifest hash.",
  );
});

test("public timestamp anchors land at the excerpt, not ten seconds before it", () => {
  const { data } = fixture();
  const candidates = [...data.claims, ...data.responses];
  const drift = [];

  for (const candidate of candidates) {
    const start = excerptStart(
      candidate.sourceId,
      candidate.window,
      candidate.excerpt,
    );
    assert.notEqual(
      start,
      null,
      `${candidate.id} excerpt must resolve inside its declared caption window`,
    );
    drift.push({
      id: candidate.id,
      anchor: Number(candidate.t),
      excerptStart: start,
      seconds: Math.abs(Number(candidate.t) - start),
    });

    for (const receipt of candidate.additionalReceipts || []) {
      const receiptStart = excerptStart(
        candidate.sourceId,
        receipt.window,
        receipt.excerpt,
      );
      assert.notEqual(
        receiptStart,
        null,
        `${receipt.id} excerpt must resolve inside its caption window`,
      );
      drift.push({
        id: receipt.id,
        anchor: Number(receipt.t),
        excerptStart: receiptStart,
        seconds: Math.abs(Number(receipt.t) - receiptStart),
      });
    }
  }

  assert.deepEqual(
    drift.filter((entry) => entry.seconds > 3),
    [],
    "Exact-second links may include a short lead-in, but must stay within three seconds of the bounded excerpt.",
  );
});
