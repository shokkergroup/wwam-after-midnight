import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import vm from "node:vm";
import { fileURLToPath } from "node:url";
import {
  NEUTRAL_RACING_ADAPTER,
  NEUTRAL_RACING_DNA
} from "./fixtures/channel-pack-neutral-racing.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const demo = path.join(here, "..", "public", "demo");

function load() {
  const sandbox = { window: {} };
  vm.createContext(sandbox);
  [
    "wwam-channel-dna.js",
    "wwam-channel-pack-adapter.js",
    "channel-pack-contract.js"
  ].forEach((file) => {
    vm.runInContext(fs.readFileSync(path.join(demo, file), "utf8"), sandbox, {
      filename: file
    });
  });
  return sandbox.window;
}

function plain(value) {
  return JSON.parse(JSON.stringify(value));
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

test("the WWAM DNA compiles into a deterministic, fingerprinted ChannelPack", () => {
  const window = load();
  const first = window.ShokkerChannelPack.compile(
    window.WWAM_CHANNEL_DNA,
    window.WWAM_CHANNEL_PACK_ADAPTER
  );
  const second = window.ShokkerChannelPack.compile(
    window.WWAM_CHANNEL_DNA,
    clone(window.WWAM_CHANNEL_PACK_ADAPTER)
  );
  const report = window.ShokkerChannelPack.validate(first);

  assert.equal(window.ShokkerChannelPack.VERSION, "1.0.0");
  assert.equal(first.identity.id, "wwam");
  assert.equal(first.sourceLanes.length, 4);
  assert.deepEqual(
    plain(first.sourceLanes.map((lane) => lane.id)),
    ["archive-deep-10", "commentary", "fresh-live", "popular-live"]
  );
  assert.equal(first.evidencePolicy.machineOutputState, "quarantine");
  assert.equal(
    first.evidencePolicy.curatedCandidateState,
    "timestamp-validated-human-curated-candidate",
  );
  assert.equal(first.evidencePolicy.curatedCandidateAuthenticated, false);
  assert.equal(first.evidencePolicy.editorVerificationRequiresAuthentication, true);
  assert.equal(first.evidencePolicy.promotionRequiresHumanReview, true);
  assert.equal(
    first.surfaceVocabulary.curatedCandidate,
    "TIMESTAMP-VALIDATED HUMAN-CURATED CANDIDATE",
  );
  assert.equal(
    first.channelExtensions.proofLabels.curatedCandidate,
    "TIMESTAMP-VALIDATED HUMAN-CURATED CANDIDATE",
  );
  assert.equal(first.storage.namespace, "shokker.youtube-wiki.wwam.v1");
  assert.deepEqual(plain(first.capabilities), [
    "ask-the-tape",
    "character-studio",
    "creator-clip-lab",
    "creator-taste-calibration",
    "fresh-tape-intake",
    "memory-graph",
    "red-band-candidate-index",
    "tape-companion"
  ]);
  assert.equal(first.fingerprint, "cp1-8ac1488f4f78448c");
  assert.equal(first.fingerprint, second.fingerprint);
  assert.deepEqual(plain(first), plain(second));
  assert.deepEqual(plain(report), {
    valid: true,
    issues: [],
    fingerprintVerified: true
  });
  assert.equal(Object.isFrozen(first), true);
  assert.equal(Object.isFrozen(first.evidencePolicy), true);
});

test("semantic set and map order do not change a compiled fingerprint", () => {
  const window = load();
  const original = window.ShokkerChannelPack.compile(
    window.WWAM_CHANNEL_DNA,
    window.WWAM_CHANNEL_PACK_ADAPTER
  );
  const reorderedDna = clone(window.WWAM_CHANNEL_DNA);
  reorderedDna.taxonomy.entityTypes.reverse();
  reorderedDna.taxonomy.receiptTypes.reverse();
  reorderedDna.taxonomy.relationships.reverse();
  reorderedDna.sourceLanes = Object.fromEntries(Object.entries(reorderedDna.sourceLanes).reverse());
  const reorderedAdapter = clone(window.WWAM_CHANNEL_PACK_ADAPTER);
  reorderedAdapter.capabilities.reverse();
  reorderedAdapter.laneInclusion = Object.fromEntries(
    Object.entries(reorderedAdapter.laneInclusion).reverse()
  );
  const reordered = window.ShokkerChannelPack.compile(reorderedDna, reorderedAdapter);

  assert.equal(reordered.fingerprint, original.fingerprint);
  assert.equal(
    window.ShokkerChannelPack.serialize(reordered),
    window.ShokkerChannelPack.serialize(original)
  );
});

test("a synthetic racing channel passes through the same compiler without WWAM identity leakage", () => {
  const window = load();
  const wwam = window.ShokkerChannelPack.compile(
    window.WWAM_CHANNEL_DNA,
    window.WWAM_CHANNEL_PACK_ADAPTER
  );
  const racingDna = clone(NEUTRAL_RACING_DNA);
  racingDna.voice = {
    proofLabels: {
      machine: "REPLAY UNDER REVIEW",
      curatedCandidate: "TIMESTAMP-VALIDATED HUMAN-CURATED RACE CANDIDATE",
      editor: "STEWARD CHECKED",
      creator: "LEAGUE CERTIFIED",
      inference: "TIMING-BASED INFERENCE"
    }
  };
  const racingAdapter = clone(NEUTRAL_RACING_ADAPTER);
  Object.assign(racingAdapter.evidencePolicy, {
    curatedCandidateState: "timestamp-validated-human-curated-candidate",
    curatedCandidateAuthenticated: false,
    editorVerificationRequiresAuthentication: true
  });
  racingAdapter.surfaceVocabulary.curatedCandidate =
    "TIMESTAMP-VALIDATED HUMAN-CURATED RACE CANDIDATE";
  const racing = window.ShokkerChannelPack.compile(racingDna, racingAdapter);
  const portfolio = window.ShokkerChannelPack.validatePortfolio([wwam, racing]);
  const serialized = window.ShokkerChannelPack.serialize(racing);

  assert.equal(racing.identity.id, "sample-racing");
  assert.equal(racing.surfaceVocabulary.ask, "ASK RACE CONTROL");
  assert.equal(racing.sourceLanes.length, 2);
  assert.notEqual(racing.fingerprint, wwam.fingerprint);
  assert.equal(portfolio.valid, true);
  assert.equal(portfolio.packCount, 2);
  assert.deepEqual(plain(portfolio.channelIds), ["sample-racing", "wwam"]);
  assert.doesNotMatch(serialized, /WWAM|Loomis|Scream|horror|UP IN YA/i);
});

test("the compiler fails closed instead of inventing missing editorial policy", () => {
  const window = load();
  const cases = [
    {
      label: "missing lane boundary",
      mutate(dna, adapter) {
        delete adapter.laneInclusion.commentary;
      },
      code: "missing-inclusion-rule"
    },
    {
      label: "machine output promoted",
      mutate(dna, adapter) {
        adapter.evidencePolicy.machineOutputState = "public";
      },
      code: "unsafe-machine-state"
    },
    {
      label: "curated candidate tier authenticated",
      mutate(dna, adapter) {
        adapter.evidencePolicy.curatedCandidateAuthenticated = true;
      },
      code: "unsafe-curated-candidate-tier"
    },
    {
      label: "curated candidate vocabulary omitted",
      mutate(dna, adapter) {
        delete adapter.surfaceVocabulary.curatedCandidate;
      },
      code: "required-string"
    },
    {
      label: "curated candidate DNA label omitted",
      mutate(dna) {
        delete dna.voice.proofLabels.curatedCandidate;
      },
      code: "required-string"
    },
    {
      label: "human review skipped",
      mutate(dna, adapter) {
        adapter.evidencePolicy.promotionRequiresHumanReview = false;
      },
      code: "unsafe-promotion"
    },
    {
      label: "review stage omitted",
      mutate(dna, adapter) {
        adapter.updateContract.stages = ["discover", "quarantine", "promote", "publish"];
      },
      code: "unsafe-update-order"
    },
    {
      label: "foreign storage namespace",
      mutate(dna, adapter) {
        adapter.storage.namespace = "shokker.youtube-wiki.someone-else.v1";
      },
      code: "namespace-channel-mismatch"
    },
    {
      label: "speaker guessing allowed",
      mutate(dna) {
        dna.qualityGates.noSpeakerGuessing = false;
      },
      code: "unsafe-evidence-policy"
    },
    {
      label: "surface state missing",
      mutate(dna, adapter) {
        delete adapter.surfaceVocabulary.unknown;
      },
      code: "required-string"
    },
    {
      label: "unknown policy typo",
      mutate(dna, adapter) {
        adapter.evidencePolicy.promoteAfterReview = true;
      },
      code: "unknown-field"
    },
    {
      label: "duplicate public states",
      mutate(dna, adapter) {
        adapter.surfaceVocabulary.unknown = adapter.surfaceVocabulary.quarantine;
      },
      code: "duplicate-vocabulary"
    }
  ];

  cases.forEach(({ label, mutate, code }) => {
    const dna = clone(window.WWAM_CHANNEL_DNA);
    const adapter = clone(window.WWAM_CHANNEL_PACK_ADAPTER);
    mutate(dna, adapter);
    assert.throws(
      () => window.ShokkerChannelPack.compile(dna, adapter),
      (error) => {
        assert.equal(error.code, "CHANNEL_PACK_REJECTED", label);
        assert.equal(error.issues.some((entry) => entry.code === code), true, label);
        return true;
      }
    );
  });
});

test("artifact tampering invalidates the fingerprint and portfolio collisions are visible", () => {
  const window = load();
  const compiled = window.ShokkerChannelPack.compile(
    window.WWAM_CHANNEL_DNA,
    window.WWAM_CHANNEL_PACK_ADAPTER
  );
  const tampered = clone(compiled);
  tampered.surfaceVocabulary.certified = "MACHINE SAID SO";
  tampered.evidencePolicy.publicExcerptWords = 250;
  tampered.surprisePolicy = "trust me";
  const report = window.ShokkerChannelPack.validate(tampered);
  const collision = window.ShokkerChannelPack.validatePortfolio([compiled, compiled]);

  assert.equal(report.valid, false);
  assert.equal(report.fingerprintVerified, false);
  assert.equal(report.issues.some((entry) => entry.code === "fingerprint-mismatch"), true);
  assert.equal(report.issues.some((entry) => entry.code === "unsafe-evidence-policy"), true);
  assert.equal(report.issues.some((entry) => entry.code === "unknown-field"), true);
  assert.equal(collision.valid, false);
  assert.equal(collision.issues.some((entry) => entry.code === "duplicate-channel"), true);
  assert.equal(collision.issues.some((entry) => entry.code === "namespace-collision"), true);
  assert.throws(
    () => window.ShokkerChannelPack.serialize(tampered),
    (error) => error.code === "CHANNEL_PACK_REJECTED"
  );
});

test("the downloadable JSON Schema and executable compiler describe the same safety boundary", () => {
  const spec = JSON.parse(fs.readFileSync(path.join(demo, "channel-pack-spec.json"), "utf8"));
  const compiler = fs.readFileSync(path.join(demo, "channel-pack-contract.js"), "utf8");
  const html = fs.readFileSync(path.join(demo, "index.html"), "utf8");

  assert.equal(spec.properties.schemaVersion.const, "1.0.0");
  assert.equal(spec.properties.contractVersion.const, "1.0.0");
  assert.deepEqual(spec.properties.updateContract.properties.stages.prefixItems, [
    { const: "discover" },
    { const: "quarantine" },
    { const: "review" },
    { const: "promote" }
  ]);
  assert.equal(spec.properties.evidencePolicy.properties.machineOutputState.const, "quarantine");
  assert.equal(
    spec.properties.evidencePolicy.properties.curatedCandidateState.const,
    "timestamp-validated-human-curated-candidate",
  );
  assert.equal(
    spec.properties.evidencePolicy.properties.curatedCandidateAuthenticated.const,
    false,
  );
  assert.equal(
    spec.properties.evidencePolicy.properties.editorVerificationRequiresAuthentication.const,
    true,
  );
  assert.ok(
    spec.properties.surfaceVocabulary.required.includes("curatedCandidate"),
  );
  assert.ok(
    spec.properties.channelExtensions.properties.proofLabels.required.includes(
      "curatedCandidate",
    ),
  );
  assert.equal(
    spec.properties.evidencePolicy.properties.promotionRequiresHumanReview.const,
    true
  );
  assert.equal(spec["x-shokker-conformance"].failureMode, "closed");
  assert.match(
    spec["x-shokker-conformance"].capabilityRule,
    /separately tested runtime contract/i
  );
  assert.deepEqual(spec.properties.capabilities.examples[0], [
    "ask-the-tape",
    "creator-taste-calibration",
    "fresh-tape-intake",
    "tape-companion"
  ]);
  assert.match(
    spec["x-shokker-conformance"].freshTapeIntakeRule,
    /no network fetch/i
  );
  assert.match(
    spec["x-shokker-conformance"].freshTapeIntakeRule,
    /holds untimed text with zero candidates/i
  );
  assert.match(
    spec["x-shokker-conformance"].freshTapeIntakeRule,
    /FNV-bound structural verification/i
  );
  assert.match(
    spec["x-shokker-conformance"].freshTapeIntakeRule,
    /do not prove source content, authenticity, ownership, speaker identity, or authority/i
  );
  assert.match(compiler, /ChannelPack rejected/);
  assert.match(compiler, /namespace-collision/);
  assert.match(
    html,
    /href="channel-pack-spec\.json" download>DOWNLOAD THE CHANNELPACK V1 SPEC/
  );
  assert.match(
    html,
    /href="channel-pack-contract\.js" download>DOWNLOAD THE FAIL-CLOSED COMPILER/
  );
});
