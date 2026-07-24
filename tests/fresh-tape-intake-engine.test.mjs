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

function clone(value) {
  return plain(value);
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
  const output = clone(artifact);
  delete output.fingerprint;
  output.fingerprint = fingerprint("fti1", output);
  return output;
}

function load(options = {}) {
  const sandbox = { window: {} };
  vm.createContext(sandbox);
  const scripts = options.engineOnly
    ? ["fresh-tape-intake-engine.js"]
    : [
        "wwam-channel-dna.js",
        "wwam-channel-pack-adapter.js",
        "channel-pack-contract.js",
        "fresh-tape-intake-engine.js",
      ];
  scripts.forEach((file) => {
    vm.runInContext(fs.readFileSync(path.join(demo, file), "utf8"), sandbox, {
      filename: file,
    });
  });
  return sandbox.window;
}

function adapterWithCapability(adapter) {
  const output = clone(adapter);
  if (!output.capabilities.includes("fresh-tape-intake")) {
    output.capabilities.push("fresh-tape-intake");
  }
  return output;
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

function source(id = "FreshTape01", overrides = {}) {
  return {
    id,
    url: `https://www.youtube.com/watch?v=${id}`,
    title: "Fresh tape test source",
    date: "2026-07-24",
    durationSeconds: 180,
    lane: "fresh-live",
    ...overrides,
  };
}

function createWwam(window, options = {}) {
  return window.ShokkerFreshTapeIntakeEngine.create({
    channelPack: options.channelPack || compileWwam(window),
    rules: options.rules || wwamRules(),
    limits: options.limits,
  });
}

function createRacing(window, options = {}) {
  return window.ShokkerFreshTapeIntakeEngine.create({
    channelPack: options.channelPack || compileRacing(window),
    rules: options.rules || racingRules(),
    limits: options.limits,
  });
}

function assertCode(fn, code) {
  assert.throws(fn, (error) => {
    assert.equal(error.code, code);
    assert.equal(typeof error.message, "string");
    assert.ok(error.message.length > 0);
    return true;
  });
}

const WEBVTT = `\uFEFFWEBVTT
Kind: captions
Language: en

NOTE this block is not evidence

00:00:01.000 --> 00:00:02.000
ghostface no way

cue-01
00:00:05.000 --> 00:00:09.500 align:start position:0%
<v Unknown>Ghostface crashes through the door and everyone in the room shouts oh my god this is absolutely unhinged tonight

cue-duplicate
00:00:05.000 --> 00:00:09.500
<v Unknown>Ghostface crashes through the door and everyone in the room shouts oh my god this is absolutely unhinged tonight

00:00:20.000 --> 00:00:22.000
PRIVATE_UNMATCHED_SECRET should never survive the public export

00:30.000 --> 00:00:33.000
That Scream theory is wild, no way.
`;

test("the UMD aliases expose one bounded, browser-safe API under 80 KB", () => {
  const window = load();
  const api = window.ShokkerFreshTapeIntakeEngine;

  assert.equal(api, window.WWAMFreshTapeIntakeEngine);
  assert.equal(api.VERSION, "1.0.0");
  assert.equal(api.SCHEMA, "shokker.fresh-tape-intake/v1");
  assert.deepEqual(plain(api.SUPPORTED_FORMATS), [
    "webvtt",
    "srt",
    "youtube-json3",
    "plain-text",
  ]);
  assert.equal(typeof api.create, "function");
  assert.equal(typeof api.FreshTapeIntakeError, "function");
  assert.equal(Object.isFrozen(api), true);
  assert.ok(
    fs.statSync(enginePath).size < 80_000,
    `engine is ${fs.statSync(enginePath).size} bytes`,
  );
});

test("a compiled ChannelPack must opt into intake and pass its full fingerprint contract", () => {
  const window = load();
  const adapterWithoutCapability = clone(window.WWAM_CHANNEL_PACK_ADAPTER);
  adapterWithoutCapability.capabilities =
    adapterWithoutCapability.capabilities.filter(
      (capability) => capability !== "fresh-tape-intake",
    );
  const ordinaryPack = window.ShokkerChannelPack.compile(
    window.WWAM_CHANNEL_DNA,
    adapterWithoutCapability,
  );
  assertCode(
    () =>
      window.ShokkerFreshTapeIntakeEngine.create({
        channelPack: ordinaryPack,
        rules: wwamRules(),
      }),
    "CAPABILITY_NOT_DECLARED",
  );

  const tampered = clone(compileWwam(window));
  tampered.evidencePolicy.publicExcerptWords = 250;
  assertCode(
    () =>
      window.ShokkerFreshTapeIntakeEngine.create({
        channelPack: tampered,
        rules: wwamRules(),
      }),
    "INVALID_CHANNEL_PACK",
  );
});

test("the embedded validator accepts a valid compiled pack when the compiler is not loaded", () => {
  const full = load();
  const pack = plain(compileWwam(full));
  const standalone = load({ engineOnly: true });
  const engine = standalone.ShokkerFreshTapeIntakeEngine.create({
    channelPack: pack,
    rules: wwamRules(),
  });

  assert.equal(engine.binding.channelId, "wwam");
  assert.equal(engine.binding.channelPackFingerprint, pack.fingerprint);
  assert.equal(engine.binding.channelPackContractVersion, "1.0.0");
});

test("WebVTT intake sorts, exactly dedupes, bounds excerpts, and stays quarantined", () => {
  const window = load();
  const engine = createWwam(window);
  const input = {
    source: source(),
    transcript: {
      format: "vtt",
      sourceId: "FreshTape01",
      content: WEBVTT.replace(/\n/g, "\r\n"),
    },
  };
  const first = engine.intake(input);
  const second = engine.intake(clone(input));
  const serialized = engine.serialize(first);

  assert.deepEqual(plain(first), plain(second));
  assert.equal(first.status, "quarantined");
  assert.equal(first.ingest.format, "webvtt");
  assert.equal(first.ingest.parsedEvents, 5);
  assert.equal(first.ingest.uniqueEvents, 4);
  assert.equal(first.ingest.duplicatesRemoved, 1);
  assert.equal(first.metrics.candidates, 6);
  assert.equal(first.metrics.topicCandidates, 3);
  assert.equal(first.metrics.signalCandidates, 3);
  assert.deepEqual(
    plain(first.candidates.map((candidate) => candidate.at)),
    [1, 1, 5, 5, 30, 30],
  );
  assert.ok(first.candidates.some((candidate) => candidate.excerpt.truncated));
  const longExcerpt = first.candidates.find(
    (candidate) => candidate.at === 5 && candidate.kind === "topic",
  ).excerpt.text;
  assert.doesNotMatch(longExcerpt, /absolutely|unhinged|tonight/i);
  first.candidates.forEach((candidate) => {
    assert.equal(candidate.state, "quarantine");
    assert.equal(candidate.machineSurfaced, true);
    assert.equal(candidate.promotionAllowed, false);
    assert.equal(candidate.speaker, null);
    assert.equal(candidate.speakerStatus, "not-diarized");
    assert.equal(candidate.authenticatedReviewCount, 0);
    assert.equal(candidate.authenticatedCertificationCount, 0);
    assert.ok(candidate.excerpt.wordCount <= 16);
    assert.equal(candidate.excerpt.wordLimit, 16);
    assert.match(candidate.timecodeUrl, /^https:\/\/www\.youtube\.com\/watch\?v=FreshTape01/);
  });
  assert.equal(first.source.channelOwnershipVerified, false);
  assert.equal(first.source.authorityStatus, "channel-ownership-unverified");
  assert.equal(first.policy.rawTranscriptExported, false);
  assert.equal(first.policy.channelOwnershipVerified, false);
  assert.equal(first.metrics.authenticatedHumanReviews, 0);
  assert.equal(first.metrics.authenticatedSpeakerCertifications, 0);
  assert.equal(first.metrics.authenticatedCreatorCertifications, 0);
  assert.equal(first.metrics.canonPromotions, 0);
  assert.doesNotMatch(serialized, /PRIVATE_UNMATCHED_SECRET/);
  assert.doesNotMatch(serialized, /WEBVTT|cue-duplicate|<v Unknown>/);
  assert.doesNotMatch(serialized, /"(?:events|segs)"\s*:/);
  assert.equal(Object.isFrozen(first), true);
  assert.equal(Object.isFrozen(first.candidates[0]), true);
  assert.throws(() => {
    first.candidates[0].promotionAllowed = true;
  }, TypeError);
});

test("equivalent VTT, SRT, and JSON3 cues produce one normalized ledger and candidate set", () => {
  const window = load();
  const engine = createWwam(window);
  const variants = [
    {
      format: "webvtt",
      content:
        "\uFEFFWEBVTT\r\n\r\n00:01.000 --> 00:03.000\r\nGhostface says no way.\r\n",
    },
    {
      format: "srt",
      content:
        "\uFEFF1\r\n00:00:01,000 --> 00:00:03,000\r\nGhostface says no way.\r\n",
    },
    {
      format: "youtube-json3",
      content: {
        events: [
          {
            dDurationMs: 2000,
            segs: [{ utf8: "Ghostface says " }, { utf8: "no way." }],
            tStartMs: 1000,
          },
        ],
      },
    },
  ];
  const artifacts = variants.map((transcript) =>
    engine.intake({
      source: source(),
      transcript,
    }),
  );

  assert.equal(
    new Set(
      artifacts.map(
        (artifact) => artifact.ingest.exactEventLedgerFingerprint,
      ),
    ).size,
    1,
  );
  assert.deepEqual(
    plain(artifacts[0].candidates),
    plain(artifacts[1].candidates),
  );
  assert.deepEqual(
    plain(artifacts[0].candidates),
    plain(artifacts[2].candidates),
  );
});

test("SRT accepts comma milliseconds, numeric IDs, overlaps, and repeated text at distinct times", () => {
  const window = load();
  const engine = createRacing(window);
  const srt = `3\r
00:00:12,500 --> 00:00:16,000\r
There is a lead change for the race lead.\r
\r
1\r
00:00:05,000 --> 00:00:08,500\r
There is a lead change for the race lead.\r
\r
2\r
00:00:07,000 --> 00:00:09,000\r
The truck is upside down after contact.\r
`;
  const artifact = engine.intake({
    source: source("RaceTape001", {
      url: "https://youtu.be/RaceTape001?feature=share",
      lane: "feature-race",
    }),
    transcript: {
      format: "srt",
      content: srt,
      videoId: "RaceTape001",
    },
  });

  assert.equal(artifact.ingest.parsedEvents, 3);
  assert.equal(artifact.ingest.uniqueEvents, 3);
  assert.equal(artifact.ingest.duplicatesRemoved, 0);
  assert.deepEqual(
    plain(artifact.candidates.map((candidate) => candidate.at)),
    [5, 7, 12.5],
  );
  assert.deepEqual(
    plain(artifact.candidates.map((candidate) => candidate.label)),
    ["LEAD CHANGE", "UPSIDE DOWN", "LEAD CHANGE"],
  );
});

test("YouTube JSON3 skips non-caption maintenance events and exactly dedupes caption tuples", () => {
  const window = load();
  const engine = createWwam(window);
  const payload = {
    videoId: "JsonTape001",
    events: [
      { wWinId: 1, wpWinPosId: 2 },
      {
        tStartMs: 9000,
        dDurationMs: 2000,
        segs: [{ utf8: "No way, " }, { utf8: "Ghostface returns." }],
      },
      {
        tStartMs: 3000,
        dDurationMs: 1500,
        segs: [{ utf8: "Halloween night." }],
      },
      {
        tStartMs: 9000,
        dDurationMs: 2000,
        segs: [{ utf8: "No way, Ghostface returns." }],
      },
    ],
  };
  const artifact = engine.intake({
    source: source("JsonTape001"),
    transcript: {
      format: "youtube-json3",
      content: payload,
    },
  });

  assert.equal(artifact.ingest.parsedEvents, 3);
  assert.equal(artifact.ingest.uniqueEvents, 2);
  assert.equal(artifact.ingest.duplicatesRemoved, 1);
  assert.deepEqual(
    plain(artifact.candidates.map((candidate) => candidate.at)),
    [3, 9, 9],
  );
  assert.equal(artifact.metrics.topicCandidates, 2);
  assert.equal(artifact.metrics.signalCandidates, 1);

  const fromJsonString = engine.intake({
    source: source("JsonTape001"),
    transcript: {
      format: "json3",
      content: JSON.stringify(payload),
    },
  });
  assert.equal(
    fromJsonString.ingest.exactEventLedgerFingerprint,
    artifact.ingest.exactEventLedgerFingerprint,
  );
  assert.deepEqual(plain(fromJsonString.candidates), plain(artifact.candidates));
});

test("untimed plain text is held with zero candidates and never copied into export", () => {
  const window = load();
  const engine = createWwam(window);
  const artifact = engine.intake({
    source: source("PlainTape01"),
    transcript: {
      format: "plain-text",
      content:
        "Ghostface appears in PRIVATE_PLAIN_TEXT_ONLY but there are no timing receipts.",
    },
  });
  const serialized = engine.serialize(artifact);

  assert.equal(artifact.status, "held");
  assert.equal(artifact.metrics.heldInputs, 1);
  assert.equal(artifact.metrics.candidates, 0);
  assert.deepEqual(plain(artifact.candidates), []);
  assert.deepEqual(plain(artifact.holdReasons), [
    {
      code: "UNTIMED_TRANSCRIPT",
      message:
        "Plain text has no timestamp evidence. It is held locally with zero derived candidates.",
    },
  ]);
  assert.doesNotMatch(serialized, /PRIVATE_PLAIN_TEXT_ONLY|Ghostface appears/);
});

test("source validation rejects spoofed hosts, duplicate IDs, mismatches, bad dates, duration, and lanes", () => {
  const window = load();
  const engine = createWwam(window);
  const validTranscript = {
    format: "webvtt",
    content: "WEBVTT\n\n00:01.000 --> 00:02.000\nGhostface.\n",
  };
  const cases = [
    [
      "INVALID_SOURCE_ID",
      source("too-short"),
    ],
    [
      "INVALID_SOURCE_URL",
      source("FreshTape01", {
        url: "http://www.youtube.com/watch?v=FreshTape01",
      }),
    ],
    [
      "INVALID_SOURCE_URL",
      source("FreshTape01", {
        url: "https://www.youtube.com.evil/watch?v=FreshTape01",
      }),
    ],
    [
      "INVALID_SOURCE_URL",
      source("FreshTape01", {
        url: "https://www.youtube.com@evil.example/watch?v=FreshTape01",
      }),
    ],
    [
      "INVALID_SOURCE_URL",
      source("FreshTape01", {
        url: "https://www.youtube.com/playlist?list=FreshTape01",
      }),
    ],
    [
      "INVALID_SOURCE_URL",
      source("FreshTape01", {
        url:
          "https://www.youtube.com/watch?v=FreshTape01&v=OtherTape01",
      }),
    ],
    [
      "SOURCE_ID_MISMATCH",
      source("FreshTape01", {
        url: "https://www.youtube.com/watch?v=OtherTape01",
      }),
    ],
    [
      "SOURCE_ID_MISMATCH",
      source("FreshTape01", {
        sourceId: "OtherTape01",
      }),
    ],
    [
      "INVALID_SOURCE_DATE",
      source("FreshTape01", { date: "2026-02-30" }),
    ],
    [
      "INVALID_SOURCE_DURATION",
      source("FreshTape01", { durationSeconds: 0 }),
    ],
    [
      "INVALID_SOURCE_DURATION",
      source("FreshTape01", {
        durationSeconds: 180,
        duration: 181,
      }),
    ],
    [
      "INVALID_SOURCE_LANE",
      source("FreshTape01", { lane: "friday-mock-race" }),
    ],
  ];

  cases.forEach(([code, badSource]) => {
    assertCode(
      () =>
        engine.intake({
          source: badSource,
          transcript: validTranscript,
        }),
      code,
    );
  });
});

test("transcript source mismatch and every out-of-range timestamp fail closed", () => {
  const window = load();
  const engine = createWwam(window);
  assertCode(
    () =>
      engine.intake({
        source: source(),
        transcript: {
          format: "webvtt",
          sourceId: "OtherTape01",
          content: "WEBVTT\n\n00:01.000 --> 00:02.000\nGhostface.\n",
        },
      }),
    "SOURCE_ID_MISMATCH",
  );
  assertCode(
    () =>
      engine.intake({
        source: source(),
        transcript: {
          format: "webvtt",
          sourceId: "FreshTape01",
          videoId: "OtherTape01",
          content: "WEBVTT\n\n00:01.000 --> 00:02.000\nGhostface.\n",
        },
      }),
    "SOURCE_ID_MISMATCH",
  );
  assertCode(
    () =>
      engine.intake({
        source: source("JsonTape001"),
        transcript: {
          format: "youtube-json3",
          content: {
            sourceId: "OtherTape01",
            events: [
              {
                tStartMs: 1000,
                dDurationMs: 1000,
                segs: [{ utf8: "Ghostface." }],
              },
            ],
          },
        },
      }),
    "SOURCE_ID_MISMATCH",
  );
  assertCode(
    () =>
      engine.intake({
        source: source("JsonTape001"),
        transcript: {
          format: "youtube-json3",
          content: {
            sourceId: "JsonTape001",
            videoId: "OtherTape01",
            events: [
              {
                tStartMs: 1000,
                dDurationMs: 1000,
                segs: [{ utf8: "Ghostface." }],
              },
            ],
          },
        },
      }),
    "SOURCE_ID_MISMATCH",
  );
  assertCode(
    () =>
      engine.intake({
        source: source("FreshTape01", { durationSeconds: 10 }),
        transcript: {
          format: "webvtt",
          content: "WEBVTT\n\n00:09.000 --> 00:11.000\nGhostface.\n",
        },
      }),
    "TIMESTAMP_OUT_OF_RANGE",
  );
  assertCode(
    () =>
      engine.intake({
        source: source(),
        transcript: {
          format: "srt",
          content: "1\n00:00:05,000 --> 00:00:04,000\nGhostface.\n",
        },
      }),
    "MALFORMED_CAPTIONS",
  );
});

test("byte, event, timestamp, per-event word, total-word, and candidate limits are enforced", () => {
  const window = load();
  const baseInput = {
    source: source(),
    transcript: {
      format: "webvtt",
      content: "WEBVTT\n\n00:01.000 --> 00:02.000\nGhostface no way.\n",
    },
  };
  const cases = [
    {
      code: "PAYLOAD_TOO_LARGE",
      limits: { maxBytes: 30 },
      input: baseInput,
    },
    {
      code: "EVENT_LIMIT_EXCEEDED",
      limits: { maxEvents: 1 },
      input: {
        source: source(),
        transcript: {
          format: "webvtt",
          content:
            "WEBVTT\n\n00:01.000 --> 00:02.000\nGhostface.\n\n00:03.000 --> 00:04.000\nScream.\n",
        },
      },
    },
    {
      code: "TIMESTAMP_OUT_OF_RANGE",
      limits: { maxTimestampSeconds: 5 },
      input: {
        source: source(),
        transcript: {
          format: "webvtt",
          content: "WEBVTT\n\n00:06.000 --> 00:07.000\nGhostface.\n",
        },
      },
    },
    {
      code: "WORD_LIMIT_EXCEEDED",
      limits: { maxWordsPerEvent: 3 },
      input: {
        source: source(),
        transcript: {
          format: "webvtt",
          content:
            "WEBVTT\n\n00:01.000 --> 00:02.000\nGhostface has far too many words.\n",
        },
      },
    },
    {
      code: "WORD_LIMIT_EXCEEDED",
      limits: { maxTotalWords: 4 },
      input: {
        source: source(),
        transcript: {
          format: "webvtt",
          content:
            "WEBVTT\n\n00:01.000 --> 00:02.000\nGhostface has words.\n\n00:03.000 --> 00:04.000\nScream has words.\n",
        },
      },
    },
    {
      code: "CANDIDATE_LIMIT_EXCEEDED",
      limits: { maxCandidates: 1 },
      input: baseInput,
    },
  ];

  cases.forEach(({ code, limits, input }) => {
    const engine = createWwam(window, { limits });
    assertCode(() => engine.intake(input), code);
  });
  assertCode(
    () =>
      createWwam(window, {
        limits: {
          maxBytes:
            window.ShokkerFreshTapeIntakeEngine.HARD_LIMITS.maxBytes + 1,
        },
      }),
    "INVALID_LIMITS",
  );
});

test("malformed and empty timed inputs fail closed with stable format errors", () => {
  const window = load();
  const engine = createWwam(window);
  const cases = [
    [
      "MALFORMED_CAPTIONS",
      {
        format: "webvtt",
        content: "WEBVTT\n\nBAD --> 00:02.000\nGhostface.\n",
      },
    ],
    [
      "NO_TIMED_EVENTS",
      {
        format: "srt",
        content: "This file has no timestamps.",
      },
    ],
    [
      "MALFORMED_JSON3",
      {
        format: "youtube-json3",
        content: "{not json}",
      },
    ],
    [
      "MALFORMED_JSON3",
      {
        format: "youtube-json3",
        content: {
          events: [
            {
              tStartMs: 1000,
              segs: [{ utf8: "Ghostface." }],
            },
          ],
        },
      },
    ],
    [
      "UNSUPPORTED_FORMAT",
      {
        format: "docx",
        content: "Ghostface.",
      },
    ],
  ];
  cases.forEach(([code, transcript]) => {
    assertCode(
      () =>
        engine.intake({
          source: source(),
          transcript,
        }),
      code,
    );
  });
});

test("malicious markup is reduced to inert text and never creates a speaker claim", () => {
  const window = load();
  const rules = wwamRules();
  rules.signals[0].label = "<img src=x onerror=alert(1)>THE ROOM BREAKS";
  const engine = createWwam(window, { rules });
  const artifact = engine.intake({
    source: source("FreshTape01", {
      title:
        "<script>window.pwned=true</script>Fresh <img src=x onerror=alert(2)> tape",
    }),
    transcript: {
      format: "webvtt",
      content: `WEBVTT

00:01.000 --> 00:03.000
<v J><img src=x onerror=alert(3)>Ghostface says no way <script>alert(4)</script>
`,
    },
  });
  const serialized = engine.serialize(artifact);

  assert.doesNotMatch(artifact.source.title, /[<>]|onerror/);
  assert.doesNotMatch(serialized, /<script|<img|onerror|<v J>/i);
  assert.match(serialized, /Ghostface says no way alert\(4\)/);
  artifact.candidates.forEach((candidate) => {
    assert.equal(candidate.speaker, null);
    assert.equal(candidate.speakerStatus, "not-diarized");
    assert.doesNotMatch(candidate.label, /[<>]|onerror/);
    assert.doesNotMatch(candidate.excerpt.text, /[<>]|onerror/);
  });
  assert.equal("pwned" in window, false);
});

test("the neutral racing ChannelPack uses the same engine with no WWAM vocabulary leakage", () => {
  const window = load();
  const engine = createRacing(window);
  const artifact = engine.intake({
    source: source("RaceTape001", {
      lane: "feature-race",
      title: "Wednesday feature race",
    }),
    transcript: {
      format: "webvtt",
      content: `WEBVTT

00:10.000 --> 00:12.000
New leader after another lead change.

00:20.000 --> 00:23.000
The number 7 truck is on its roof.
`,
    },
  });
  const serialized = engine.serialize(artifact);

  assert.equal(artifact.binding.channelId, "sample-racing");
  assert.equal(artifact.policy.publicStateLabel, "REPLAY UNDER REVIEW");
  assert.deepEqual(
    plain(artifact.candidates.map((candidate) => candidate.label)),
    ["LEAD CHANGE", "UPSIDE DOWN"],
  );
  assert.doesNotMatch(
    serialized,
    /WWAM|Scream|Ghostface|Loomis|horror|UP IN YA|THE ROOM BREAKS/i,
  );
});

test("exports are deterministic, bound, strict, and tamper-detecting", () => {
  const window = load();
  const engine = createWwam(window);
  const artifact = engine.intake({
    source: source(),
    transcript: {
      format: "webvtt",
      content: "WEBVTT\n\n00:01.000 --> 00:03.000\nGhostface says no way.\n",
    },
  });
  const first = engine.serialize(artifact);
  const second = engine.serialize(clone(artifact));
  const verified = engine.verifyExport(first);

  assert.equal(first, second);
  assert.equal(first.endsWith("\n"), true);
  assert.equal(verified.ok, true);
  assert.equal(verified.fingerprint, artifact.fingerprint);
  assert.deepEqual(plain(verified.issues), []);

  const candidateTamper = clone(artifact);
  candidateTamper.candidates[0].promotionAllowed = true;
  const candidateReport = engine.verifyExport(candidateTamper);
  assert.equal(candidateReport.ok, false);
  assert.ok(
    candidateReport.issues.some((issue) => issue.code === "UNSAFE_CANDIDATE"),
  );
  assert.ok(
    candidateReport.issues.some((issue) => issue.code === "FINGERPRINT_MISMATCH"),
  );

  const authorityTamper = clone(artifact);
  authorityTamper.metrics.authenticatedCreatorCertifications = 1;
  const authorityReport = engine.verifyExport(authorityTamper);
  assert.equal(authorityReport.ok, false);
  assert.ok(
    authorityReport.issues.some(
      (issue) => issue.code === "UNSUPPORTED_AUTHORITY_CLAIM",
    ),
  );

  const rawTamper = clone(artifact);
  rawTamper.rawTranscript = "do not export me";
  const rawReport = engine.verifyExport(rawTamper);
  assert.equal(rawReport.ok, false);
  assert.ok(
    rawReport.issues.some(
      (issue) => issue.code === "UNSUPPORTED_EXPORT_FIELD",
    ),
  );
  assertCode(() => engine.serialize(rawTamper), "INVALID_EXPORT");
});

test("exports from another rule set or ChannelPack fail their local binding", () => {
  const window = load();
  const firstEngine = createWwam(window);
  const artifact = firstEngine.intake({
    source: source(),
    transcript: {
      format: "webvtt",
      content: "WEBVTT\n\n00:01.000 --> 00:03.000\nGhostface says no way.\n",
    },
  });
  const otherRules = wwamRules();
  otherRules.signals[0].terms.push("absolutely");
  const otherEngine = createWwam(window, { rules: otherRules });
  const foreignRules = otherEngine.verifyExport(artifact);
  assert.equal(foreignRules.ok, false);
  assert.ok(
    foreignRules.issues.some((issue) => issue.code === "FOREIGN_RULES"),
  );

  const racing = createRacing(window);
  const foreignChannel = racing.verifyExport(artifact);
  assert.equal(foreignChannel.ok, false);
  assert.ok(
    foreignChannel.issues.some((issue) => issue.code === "FOREIGN_CHANNEL"),
  );
});

test("rules are explicit literal phrases, normalized deterministically, and defensively copied", () => {
  const window = load();
  const rules = wwamRules();
  rules.topics.reverse();
  rules.topics[0].terms.reverse();
  const engine = createWwam(window, { rules });
  const originalFingerprint = engine.binding.rulesFingerprint;

  rules.topics[0].terms.push("later mutation");
  assert.equal(engine.binding.rulesFingerprint, originalFingerprint);
  assert.equal(Object.isFrozen(engine), true);
  assert.equal(Object.isFrozen(engine.rules), true);
  assert.deepEqual(
    plain(engine.rules.topics.map((rule) => rule.id)),
    ["halloween", "scream"],
  );
  assert.doesNotMatch(JSON.stringify(engine.rules), /later mutation/);
  assertCode(
    () =>
      createWwam(window, {
        rules: {
          topics: [
            {
              id: "unsafe",
              label: "UNSAFE",
              terms: ["ghost.*face"],
              regex: true,
            },
          ],
          signals: [],
        },
      }),
    "INVALID_RULE",
  );
});

test("zero-second evidence keeps an explicit timecode and exact duration edges stay closed", () => {
  const window = load();
  const engine = createWwam(window);
  const artifact = engine.intake({
    source: source("ZeroTape001", {
      url: "https://www.youtube.com/shorts/ZeroTape001?feature=share",
      durationSeconds: 10,
    }),
    transcript: {
      format: "webvtt",
      content:
        "WEBVTT\n\n00:00.000 --> 00:10.000\nGhostface says no way.\n",
    },
  });

  assert.equal(artifact.candidates[0].at, 0);
  assert.equal(
    artifact.candidates[0].timecodeUrl,
    "https://www.youtube.com/watch?v=ZeroTape001&t=0s",
  );
  assert.equal(artifact.candidates[0].end, 10);
  assert.equal(engine.verifyExport(artifact).ok, true);

  assertCode(
    () =>
      engine.intake({
        source: source("ZeroTape001", {
          durationSeconds: 0.0004,
          url: "https://youtu.be/ZeroTape001",
        }),
        transcript: {
          format: "webvtt",
          content: "WEBVTT\n\n00:00.000 --> 00:00.000\nGhostface.\n",
        },
      }),
    "INVALID_SOURCE_DURATION",
  );
});

test("JSON3 cannot hide a source mismatch behind trusted outer transcript metadata", () => {
  const window = load();
  const engine = createWwam(window);

  assertCode(
    () =>
      engine.intake({
        source: source("JsonTape001"),
        transcript: {
          format: "youtube-json3",
          sourceId: "JsonTape001",
          content: {
            videoId: "OtherTape01",
            events: [
              {
                tStartMs: 1000,
                dDurationMs: 1000,
                segs: [{ utf8: "Ghostface." }],
              },
            ],
          },
        },
      }),
    "SOURCE_ID_MISMATCH",
  );
});

test("the engine snapshots ChannelPack boundaries before any later caller mutation", () => {
  const window = load();
  const mutablePack = clone(compileWwam(window));
  const engine = createWwam(window, { channelPack: mutablePack });
  const originalBinding = clone(engine.binding);

  mutablePack.identity.id = "hostile-channel";
  mutablePack.sourceLanes.find((lane) => lane.id === "fresh-live").id =
    "hostile-lane";
  mutablePack.sourceLanes[0].label = "<img src=x onerror=alert(1)>";
  mutablePack.evidencePolicy.publicExcerptWords = 25;
  mutablePack.storage.namespace = "hostile";

  const artifact = engine.intake({
    source: source(),
    transcript: {
      format: "webvtt",
      content: "WEBVTT\n\n00:01.000 --> 00:02.000\nGhostface.\n",
    },
  });

  assert.deepEqual(plain(engine.binding), originalBinding);
  assert.equal(artifact.binding.channelId, "wwam");
  assert.equal(artifact.source.lane, "fresh-live");
  assert.doesNotMatch(artifact.source.laneLabel, /hostile|onerror|img/i);
  assert.equal(artifact.policy.publicExcerptWordLimit, 16);
});

test("re-signed structural tampering fails semantic checks without relying on checksum mismatch", () => {
  const window = load();
  const engine = createWwam(window);
  const artifact = engine.intake({
    source: source(),
    transcript: {
      format: "webvtt",
      content: "WEBVTT\n\n00:01.000 --> 00:03.000\nGhostface says no way.\n",
    },
  });
  const cases = [
    {
      code: "INVALID_BINDING",
      mutate(value) {
        value.binding.storageNamespace = "cross-channel";
      },
    },
    {
      code: "INVALID_SOURCE_BINDING",
      mutate(value) {
        delete value.source.authorityStatus;
      },
    },
    {
      code: "INVALID_CANDIDATE_SOURCE",
      mutate(value) {
        value.candidates[0].timecodeUrl =
          "https://www.youtube.com/watch?v=FreshTape01";
      },
    },
    {
      code: "INVALID_CANDIDATE_DERIVATION",
      mutate(value) {
        value.candidates[0].id = "ftc1-0000000000000000";
      },
    },
    {
      code: "INVALID_METRICS",
      mutate(value) {
        value.metrics.candidates = 0;
      },
    },
    {
      code: "INVALID_STRUCTURE",
      mutate(value) {
        delete value.candidates;
      },
    },
  ];

  cases.forEach(({ code, mutate }) => {
    const tampered = clone(artifact);
    mutate(tampered);
    const report = engine.verifyExport(resign(tampered));
    assert.equal(report.ok, false);
    assert.ok(
      report.issues.some((issue) => issue.code === code),
      `${code} was not reported: ${JSON.stringify(report.issues)}`,
    );
    assert.equal(
      report.issues.some((issue) => issue.code === "FINGERPRINT_MISMATCH"),
      false,
      `${code} depended only on the checksum`,
    );
  });
});

test("prototype-smuggled schema fields, cyclic exports, and non-scalar metadata fail closed", () => {
  const window = load();
  const engine = createWwam(window);
  const inheritedSource = Object.create(source());

  assertCode(
    () =>
      engine.intake({
        source: inheritedSource,
        transcript: {
          format: "webvtt",
          content: "WEBVTT\n\n00:01.000 --> 00:02.000\nGhostface.\n",
        },
      }),
    "INVALID_SOURCE",
  );
  assertCode(
    () =>
      engine.intake({
        source: source("FreshTape01", {
          durationSeconds: [180],
        }),
        transcript: {
          format: "webvtt",
          content: "WEBVTT\n\n00:01.000 --> 00:02.000\nGhostface.\n",
        },
      }),
    "INVALID_SOURCE_DURATION",
  );
  assertCode(
    () =>
      createWwam(window, {
        rules: {
          topics: [{ id: "unsafe", label: "UNSAFE", terms: [123] }],
          signals: [],
        },
      }),
    "INVALID_RULE",
  );

  const artifact = engine.intake({
    source: source(),
    transcript: {
      format: "webvtt",
      content: "WEBVTT\n\n00:01.000 --> 00:02.000\nGhostface.\n",
    },
  });
  const cyclic = clone(artifact);
  cyclic.self = cyclic;
  const report = engine.verifyExport(cyclic);
  assert.equal(report.ok, false);
  assert.deepEqual(plain(report.issues), [
    {
      code: "INVALID_EXPORT",
      path: "artifact",
      message: "Export must be a JSON object.",
    },
  ]);
  assertCode(() => engine.serialize(cyclic), "INVALID_EXPORT");
});

test("prototype keys remain inert and reversed Unicode cues yield deterministic exports", () => {
  const window = load();
  const engine = createWwam(window);
  const json3 = JSON.parse(`{
    "__proto__": {"polluted": true},
    "videoId": "FreshTape01",
    "events": [
      {
        "tStartMs": 1000,
        "dDurationMs": 1000,
        "segs": [{"utf8": "Ghostface says no way."}]
      }
    ]
  }`);
  const jsonArtifact = engine.intake({
    source: source(),
    transcript: {
      format: "youtube-json3",
      content: json3,
    },
  });
  assert.equal(engine.verifyExport(jsonArtifact).ok, true);
  assert.equal(Object.prototype.polluted, undefined);

  const cues = [
    "00:01.000 --> 00:02.000\nGhostface Ångström.",
    "00:01.000 --> 00:02.000\nGhostface Zulu.",
  ];
  const first = engine.intake({
    source: source(),
    transcript: {
      format: "webvtt",
      content: `WEBVTT\n\n${cues.join("\n\n")}\n`,
    },
  });
  const reversed = engine.intake({
    source: source(),
    transcript: {
      format: "webvtt",
      content: `WEBVTT\n\n${cues.reverse().join("\n\n")}\n`,
    },
  });
  assert.equal(
    first.ingest.exactEventLedgerFingerprint,
    reversed.ingest.exactEventLedgerFingerprint,
  );
  assert.deepEqual(plain(first.candidates), plain(reversed.candidates));
  assert.equal(engine.serialize(first), engine.serialize(first));
  assert.equal(engine.serialize(reversed), engine.serialize(reversed));
});
