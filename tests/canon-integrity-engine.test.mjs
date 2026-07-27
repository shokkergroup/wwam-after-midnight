import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const demo = path.join(here, "..", "public", "demo");

function load() {
  const sandbox = { window: {} };
  vm.createContext(sandbox);
  [
    "catalog.js",
    "deep-distill.js",
    "livestream-distill.js",
    "popular-live-distill.js",
    "character-lore.js",
    "wwam-channel-dna.js",
    "showcase-engine.js",
    "lore-engine.js",
    "creator-studio-engine.js",
    "cold-open-engine.js",
    "canon-integrity-engine.js"
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

function current(window) {
  const input = {
    catalog: window.WWAM_CATALOG,
    deep: window.WWAM_DEEP_DISTILL,
    live: window.WWAM_LIVESTREAMS,
    popular: window.WWAM_POPULAR_LIVE,
    characters: window.WWAM_CHARACTER_LORE,
    dna: window.WWAM_CHANNEL_DNA
  };
  const showcase = window.WWAMShowcaseEngine.create(input);
  const lore = window.WWAMLoreEngine.create(input);
  const clip = window.WWAMCreatorClipLab.create({ showcase });
  const campaign = clip.buildCampaignPacket({
    theme: "Canon Audit",
    shortCount: 4,
    supercutCount: 1,
    resurfaceCount: 1
  });
  const coldOpen = window.WWAMColdOpenFactory.create({ clipLab: clip });
  const coldOpenCampaign = coldOpen.createCampaignMetadata(
    [
      coldOpen.getStoryboards({ format: 15 })[0],
      coldOpen.getStoryboards({ format: 60 })[0]
    ],
    { name: "Canon Audit Cold Opens" }
  );
  return {
    ...input,
    showcase,
    lore,
    clip,
    campaigns: [campaign, coldOpenCampaign]
  };
}

function validFixture() {
  const source = {
    id: "source-one",
    type: "livestream",
    title: "Synthetic source",
    date: "2026-07-23",
    duration: 100,
    url: "https://www.youtube.com/watch?v=source-one",
    captioned: true
  };
  const receipt = {
    id: "receipt-one",
    sourceId: source.id,
    t: 10,
    type: "moment",
    excerpt: "A short machine surfaced caption.",
    evidenceLevel: "machine"
  };
  const characterReceipt = {
    id: "receipt-character",
    sourceId: source.id,
    t: 20,
    type: "character-performance",
    characterId: "character:loomis",
    performer: "J",
    excerpt: "Michael escaped again.",
    evidenceLevel: "editor"
  };
  const loreReceipt = {
    id: "lore-one",
    kind: "archive-source",
    sourceId: source.id,
    t: 0,
    quote: "A derived source summary.",
    provenance: {
      basis: "Derived from the supplied synthetic archive data."
    }
  };
  const short = {
    id: "short-one",
    kind: "short-candidate",
    receiptId: receipt.id,
    sourceId: source.id,
    receiptAt: 10,
    archivalExcerpt: receipt.excerpt,
    editWindow: { in: 8, out: 14 },
    evidence: { evidenceLevel: "machine" },
    provenance: { evidenceLevel: "machine" },
    speaker: {
      display: null,
      creditAllowed: false,
      basis: "Auto-captions are not speaker-diarized."
    }
  };
  const manifest = {
    schema: "shokker.creator-clip-manifest/v1",
    manifestId: "manifest-one",
    receiptIds: [receipt.id],
    sourceIds: [source.id],
    clips: [
      {
        clipId: "manifest-clip-one",
        receiptId: receipt.id,
        sourceId: source.id,
        receiptAt: 10,
        archivalExcerpt: receipt.excerpt
      }
    ]
  };
  const campaign = {
    schema: "shokker.creator-campaign-packet/v1",
    id: "campaign-one",
    assets: {
      shorts: [short],
      supercuts: [],
      resurfacing: []
    },
    releasePlan: [
      {
        assetId: short.id,
        proofReceiptId: receipt.id
      }
    ],
    proofLedger: {
      receiptIds: [receipt.id],
      sourceIds: [source.id]
    },
    approvalBoard: {
      evidenceReady: [short.id],
      fastReview: [],
      contextReview: [],
      hold: []
    },
    manifest
  };

  return {
    catalog: [source],
    deep: { generated: "2026-07-23" },
    live: { streams: [] },
    popular: { streams: [] },
    characters: {
      characters: [
        {
          id: "loomis",
          performedBy: "J",
          hostAttribution: {
            status: "user-supplied",
            basis: "The project owner supplied this mapping."
          },
          soundbytes: [
            {
              id: "loomis-one",
              receiptId: characterReceipt.id,
              sourceId: source.id,
              t: 20,
              excerpt: characterReceipt.excerpt
            }
          ]
        }
      ]
    },
    showcase: {
      snapshotDate: "2026-07-23",
      sources: [source],
      receipts: [receipt, characterReceipt],
      memoryGraph: {
        nodes: [{ id: "node-one" }],
        edges: [
          {
            id: "edge-one",
            from: "node-one",
            to: "node-one",
            receiptIds: [receipt.id]
          }
        ]
      }
    },
    lore: {
      receipts: [loreReceipt],
      fieldGuide: [
        {
          id: "field-one",
          receiptIds: [loreReceipt.id],
          archiveFirst: { receiptId: loreReceipt.id }
        }
      ],
      lineages: [
        {
          id: "lineage-one",
          events: [
            {
              receiptId: loreReceipt.id,
              sourceId: source.id,
              t: 0
            }
          ]
        }
      ],
      galaxy: {
        nodes: [{ id: "lore-node-one" }],
        edges: [
          {
            id: "lore-edge-one",
            from: "lore-node-one",
            to: "lore-node-one",
            receiptIds: [loreReceipt.id],
            previewReceipt: loreReceipt.id
          }
        ],
        constellations: [
          {
            id: "constellation-one",
            anchorNodeId: "lore-node-one",
            nodeIds: ["lore-node-one"],
            edgeIds: ["lore-edge-one"],
            receiptIds: [loreReceipt.id]
          }
        ]
      }
    },
    clip: {
      shorts: [short],
      supercuts: [],
      resurfacing: []
    },
    campaigns: [campaign],
    manifests: [],
    publicCopy: [
      {
        id: "public-caption",
        evidenceType: "caption-excerpt",
        evidenceLevel: "machine",
        label: "TIMESTAMPED CAPTION RECEIPT",
        text: "A short machine surfaced caption.",
        sourceId: source.id,
        t: 10
      },
      {
        id: "public-derived",
        evidenceType: "derived-source-summary",
        label: "SOURCE-LEVEL DERIVED SUMMARY",
        text: "A derived source summary."
      },
      {
        id: "public-metadata",
        evidenceType: "source-metadata",
        label: "SOURCE METADATA ONLY",
        text: "Synthetic source"
      }
    ]
  };
}

test("current corpus passes canon integrity with deterministic internal-only warnings", () => {
  const window = load();
  const input = current(window);
  const first = window.WWAMCanonIntegrity.audit(input);
  const second = window.WWAMCanonIntegrity.audit(input);

  assert.equal(window.WWAMCanonIntegrity.VERSION, "1.2.0");
  assert.equal(first.engine, "SHOKKER CANON INTEGRITY AUDIT");
  assert.equal(first.snapshotDate, "2026-07-23");
  assert.equal(first.ok, true);
  assert.equal(first.status, "PASS");
  assert.equal(first.fingerprint, second.fingerprint);
  assert.deepEqual(plain(first), plain(second));
  assert.equal(first.metrics.sources, 74);
  assert.equal(first.metrics.characterEvidenceSources, 23);
  assert.equal(first.metrics.ownedEvidenceSources, 97);
  assert.equal(first.metrics.showcaseReceipts, 877);
  assert.equal(first.metrics.loreReceipts, 1011);
  assert.equal(first.metrics.loreGraphNodes, 200);
  assert.equal(first.metrics.loreGraphEdges, 917);
  assert.equal(first.metrics.clipShorts, 565);
  assert.equal(first.metrics.clipSupercuts, 32);
  assert.equal(first.metrics.clipResurfacing, 21);
  assert.equal(first.metrics.campaigns, 2);
  assert.equal(first.summary.errors, 0);
  assert.equal(first.summary.warnings, 362);
  assert.deepEqual(plain(first.summary.byCode), {
    INTERNAL_EXCERPT_REQUIRES_BOUNDING: 362
  });
  assert.equal(
    first.violations.every(
      (violation) =>
        violation.code === "INTERNAL_EXCERPT_REQUIRES_BOUNDING" &&
        violation.severity === "warning" &&
        violation.details.publicSurface === false
    ),
    true
  );
  assert.equal(
    first.checks.find((check) => check.code === "PUBLIC_EXCERPT_TOO_LONG")
      .status,
    "PASS"
  );
  assert.equal(
    window.WWAMCanonIntegrity.assert(input).fingerprint,
    first.fingerprint
  );
});

test("a compact valid fixture passes every hard contract", () => {
  const window = load();
  const report = window.WWAMCanonIntegrity.audit(validFixture());

  assert.equal(report.ok, true);
  assert.equal(report.summary.errors, 0);
  assert.equal(report.summary.warnings, 0);
  assert.equal(report.violations.length, 0);
  report.checks.forEach((check) => assert.equal(check.status, "PASS"));
});
test("a new official character tape can extend source ownership without admitting mere mentions", () => {
  const window = load();
  const fixture = validFixture();
  const sourceId = "AbCdEfGhI_1";
  const evidence = {
    id: "loomis-new-tape",
    sourceId,
    sourceType: "livestream",
    sourceTitle: "A newly distilled official livestream",
    date: "2026-07-24",
    t: 42,
    url: `https://www.youtube.com/watch?v=${sourceId}&t=42s`,
    playback: {
      provider: "youtube",
      start: 42,
      end: 56,
      clipSeconds: 14,
      embedUrl: `https://www.youtube.com/embed/${sourceId}?start=42&end=56`
    },
    excerpt: "Michael cannot be trusted with that responsibility.",
    classification: "actual-character-performance",
    playability: {
      status: "eligible",
      provider: "youtube",
      metadataStatus: "official-public-cached"
    },
    provenance: {
      channelId: "UC6ieEOZW4iXV8TcILJI8k5g",
      timestampStatus: "exact-caption-event",
      selection: "human-curated seed with deterministic caption validation"
    }
  };
  const character = fixture.characters.characters[0];
  character.soundbytes.push(evidence);
  fixture.showcase.receipts.push({
    id: "character-receipt:loomis-new-tape",
    sourceId,
    t: 42,
    type: "character-performance",
    characterId: "character:loomis",
    performer: "J",
    excerpt: evidence.excerpt,
    evidenceLevel: "editor"
  });

  const accepted = plain(window.WWAMCanonIntegrity.audit(fixture));
  assert.equal(accepted.ok, true);
  assert.equal(accepted.metrics.sources, 1);
  assert.equal(accepted.metrics.characterEvidenceSources, 1);
  assert.equal(accepted.metrics.ownedEvidenceSources, 2);

  evidence.classification = "mere-mention";
  const rejected = plain(window.WWAMCanonIntegrity.audit(fixture));
  assert.equal(rejected.ok, false);
  assert.ok(
    rejected.violations.some(
      (violation) =>
        violation.code === "SOURCE_REFERENCE_ORPHAN" &&
        violation.details?.sourceId === sourceId
    )
  );
});

test("clip-level speaker credit binds to the exact receipt-certified speaker", () => {
  const window = load();
  const fixture = validFixture();
  const characterReceipt = fixture.showcase.receipts[1];
  const short = fixture.clip.shorts[0];
  const campaign = fixture.campaigns[0];
  const manifestClip = campaign.manifest.clips[0];

  characterReceipt.performer = "Mike";
  const mismatchedMapping = window.WWAMCanonIntegrity.audit(fixture);
  assert.equal(mismatchedMapping.ok, false);
  assert.ok(
    mismatchedMapping.violations.some(
      (violation) =>
        violation.code === "SPEAKER_CLAIM_UNSUPPORTED" &&
        violation.path === "showcase.receipts[1].performer"
    )
  );
  characterReceipt.performer = "J";

  Object.assign(short, {
    receiptId: characterReceipt.id,
    receiptAt: characterReceipt.t,
    archivalExcerpt: characterReceipt.excerpt,
    editWindow: { in: 18, out: 24 },
    evidence: { evidenceLevel: "editor" },
    provenance: { evidenceLevel: "editor" },
    speaker: {
      display: "J",
      creditAllowed: true,
      clipAttributionCertified: true,
      basis: "Project-owner mapping plus a specific clip review."
    }
  });
  campaign.releasePlan[0].proofReceiptId = characterReceipt.id;
  campaign.proofLedger.receiptIds = [characterReceipt.id];
  campaign.manifest.receiptIds = [characterReceipt.id];
  Object.assign(manifestClip, {
    receiptId: characterReceipt.id,
    receiptAt: characterReceipt.t,
    archivalExcerpt: characterReceipt.excerpt
  });

  const unauthenticated = window.WWAMCanonIntegrity.audit(fixture);
  assert.equal(unauthenticated.ok, false);
  assert.ok(
    unauthenticated.violations.some(
      (violation) => violation.code === "SPEAKER_CLAIM_UNSUPPORTED"
    )
  );

  characterReceipt.authenticatedEditorVerified = true;
  const contextVerifiedOnly = window.WWAMCanonIntegrity.audit(fixture);
  assert.equal(contextVerifiedOnly.ok, false);
  assert.ok(
    contextVerifiedOnly.violations.some(
      (violation) => violation.code === "SPEAKER_CLAIM_UNSUPPORTED"
    )
  );

  characterReceipt.certifiedSpeaker = "J";
  const editorWithExactSpeaker = window.WWAMCanonIntegrity.audit(fixture);
  assert.equal(editorWithExactSpeaker.ok, false);
  assert.ok(
    editorWithExactSpeaker.violations.some(
      (violation) =>
        violation.code === "SPEAKER_CLAIM_UNSUPPORTED" &&
        violation.path === "showcase.receipts[1].certifiedSpeaker"
    )
  );
  delete characterReceipt.certifiedSpeaker;

  characterReceipt.evidenceLevel = "creator";
  characterReceipt.authenticatedCreatorCertified = true;
  short.evidence.evidenceLevel = "creator";
  short.provenance.evidenceLevel = "creator";
  const creatorAuthWithoutSpeakerCertification =
    window.WWAMCanonIntegrity.audit(fixture);
  assert.equal(creatorAuthWithoutSpeakerCertification.ok, false);
  assert.ok(
    creatorAuthWithoutSpeakerCertification.violations.some(
      (violation) =>
        violation.code === "SPEAKER_CLAIM_UNSUPPORTED" &&
        violation.path === "clip.shorts[0].speaker"
    )
  );

  characterReceipt.certifiedSpeaker = "J";
  short.speaker.display = "Mike";
  const mismatchedCertifiedSpeaker =
    window.WWAMCanonIntegrity.audit(fixture);
  assert.equal(mismatchedCertifiedSpeaker.ok, false);
  assert.ok(
    mismatchedCertifiedSpeaker.violations.some(
      (violation) =>
        violation.code === "SPEAKER_CLAIM_UNSUPPORTED" &&
        violation.path === "clip.shorts[0].speaker" &&
        violation.details.certifiedSpeaker === "J"
    )
  );

  short.speaker.display = "An Arbitrary Host";
  const arbitrarySpeaker = window.WWAMCanonIntegrity.audit(fixture);
  assert.equal(arbitrarySpeaker.ok, false);
  assert.ok(
    arbitrarySpeaker.violations.some(
      (violation) =>
        violation.code === "SPEAKER_CLAIM_UNSUPPORTED" &&
        violation.path === "clip.shorts[0].speaker"
    )
  );

  short.speaker.display = "J";
  const explicitlyCertified = window.WWAMCanonIntegrity.audit(fixture);
  assert.equal(explicitlyCertified.ok, true);
  assert.equal(explicitlyCertified.summary.errors, 0);

  manifestClip.speaker = {
    display: null,
    creditAllowed: true,
    clipAttributionCertified: true,
    basis: "Project-owner mapping plus a creator-certified clip review."
  };
  manifestClip.speakerCredit = "Mike";
  const mismatchedLegacyCredit = window.WWAMCanonIntegrity.audit(fixture);
  assert.equal(mismatchedLegacyCredit.ok, false);
  assert.ok(
    mismatchedLegacyCredit.violations.some(
      (violation) =>
        violation.code === "SPEAKER_CLAIM_UNSUPPORTED" &&
        violation.path === "campaigns[0].manifest.clips[0].speaker" &&
        violation.details.certifiedSpeaker === "J"
    )
  );

  manifestClip.speakerCredit = "J";
  const exactLegacyCredit = window.WWAMCanonIntegrity.audit(fixture);
  assert.equal(exactLegacyCredit.ok, true);
  assert.equal(exactLegacyCredit.summary.errors, 0);
});

test("synthetic corruption trips every required canon-integrity category", () => {
  const window = load();
  const broken = validFixture();
  broken.catalog.push({ ...broken.catalog[0] });
  broken.showcase.receipts.push({
    ...broken.showcase.receipts[0],
    sourceId: "source-one",
    t: 120,
    evidenceLevel: "invented",
    performer: "Mike"
  });
  broken.showcase.receipts.push({
    id: "orphan-source-receipt",
    sourceId: "missing-source",
    t: 12,
    type: "moment",
    excerpt: "This points nowhere.",
    evidenceLevel: "machine"
  });
  broken.showcase.receipts.push({
    id: "missing-source-receipt",
    sourceId: "",
    t: "ten",
    type: "moment",
    excerpt: "This has no source.",
    evidenceLevel: "machine"
  });
  broken.showcase.memoryGraph.edges.push({
    id: "edge-broken",
    from: "missing-node",
    to: "node-one",
    receiptIds: ["missing-receipt"]
  });
  broken.lore.galaxy.constellations[0].edgeIds.push("missing-edge");
  broken.lore.fieldGuide[0].receiptIds.push("missing-lore-receipt");

  const short = broken.clip.shorts[0];
  short.evidence.evidenceLevel = "editor";
  short.editWindow = { in: 14, out: 9 };
  short.speaker = {
    display: "Mike",
    creditAllowed: false,
    basis: "The model guessed."
  };
  broken.campaigns[0].releasePlan.push({
    assetId: "missing-asset",
    proofReceiptId: "missing-receipt"
  });
  broken.campaigns[0].proofLedger.sourceIds.push("missing-source");
  broken.publicCopy.push({
    id: "bad-public-copy",
    evidenceType: "source-metadata",
    evidenceLevel: "invented",
    label: "ARCHIVAL QUOTE",
    isQuote: true,
    text:
      "one two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen sixteen seventeen"
  });

  const first = window.WWAMCanonIntegrity.audit(broken);
  const second = window.WWAMCanonIntegrity.audit(broken);
  const codes = new Set(first.violations.map((violation) => violation.code));

  assert.equal(first.ok, false);
  assert.equal(first.status, "FAIL");
  assert.equal(first.fingerprint, second.fingerprint);
  assert.deepEqual(plain(first.violations), plain(second.violations));
  [
    "DUPLICATE_ID",
    "INVALID_TIMESTAMP",
    "TIMESTAMP_OUT_OF_RANGE",
    "SOURCE_ID_MISSING",
    "SOURCE_REFERENCE_ORPHAN",
    "SPEAKER_CLAIM_UNSUPPORTED",
    "PUBLIC_EXCERPT_TOO_LONG",
    "PUBLIC_COPY_MISLABELED",
    "EVIDENCE_LEVEL_CONTRADICTION",
    "GRAPH_NODE_ORPHAN",
    "GRAPH_RECEIPT_ORPHAN",
    "CAMPAIGN_ASSET_ORPHAN",
    "CAMPAIGN_RECEIPT_ORPHAN",
    "CAMPAIGN_SOURCE_ORPHAN"
  ].forEach((code) => assert.equal(codes.has(code), true, code));
  assert.equal(
    first.violations.every(
      (violation, index, values) =>
        index === 0 ||
        violation.severity !== "error" ||
        values[index - 1].severity === "error"
    ),
    true
  );
});

test("missing inputs fail closed and assert carries the deterministic report", () => {
  const window = load();
  const first = window.WWAMCanonIntegrity.audit({});
  const second = window.WWAMCanonIntegrity.audit({});

  assert.equal(first.ok, false);
  assert.equal(first.status, "FAIL");
  assert.equal(first.summary.byCode.INPUT_MISSING, 14);
  assert.equal(first.fingerprint, second.fingerprint);
  assert.throws(
    () => window.WWAMCanonIntegrity.assert({}),
    (error) => {
      assert.equal(error.name, "CanonIntegrityError");
      assert.equal(error.report.fingerprint, first.fingerprint);
      assert.match(error.message, /14 error/);
      return true;
    }
  );
});

test("only explicit public surfaces enforce the 16-word excerpt ceiling", () => {
  const window = load();
  const fixture = validFixture();
  fixture.showcase.receipts[0].excerpt =
    "one two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen sixteen seventeen";
  fixture.clip.shorts[0].archivalExcerpt =
    fixture.showcase.receipts[0].excerpt;
  fixture.publicCopy = [];

  const internal = window.WWAMCanonIntegrity.audit(fixture);
  assert.equal(internal.ok, true);
  assert.equal(internal.summary.byCode.INTERNAL_EXCERPT_REQUIRES_BOUNDING, 1);
  assert.equal(internal.summary.byCode.PUBLIC_EXCERPT_TOO_LONG, undefined);

  fixture.campaigns[0].manifest.clips[0].archivalExcerpt =
    fixture.showcase.receipts[0].excerpt;
  const exported = window.WWAMCanonIntegrity.audit(fixture);
  assert.equal(exported.ok, false);
  assert.equal(exported.summary.byCode.PUBLIC_EXCERPT_TOO_LONG, 1);

  fixture.campaigns[0].manifest.clips[0].archivalExcerpt =
    "A short machine surfaced caption.";
  fixture.publicCopy.push({
    id: "public-long",
    evidenceType: "caption-excerpt",
    evidenceLevel: "machine",
    label: "TIMESTAMPED CAPTION RECEIPT",
    text: fixture.showcase.receipts[0].excerpt,
    sourceId: "source-one",
    t: 10
  });
  const published = window.WWAMCanonIntegrity.audit(fixture);
  assert.equal(published.ok, false);
  assert.equal(published.summary.byCode.PUBLIC_EXCERPT_TOO_LONG, 1);
});
