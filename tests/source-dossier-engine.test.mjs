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
  signalScore = null,
  signalBasis = null,
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
    signalScore,
    signalBasis,
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
  showWiki = null,
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
    showWiki,
  };
}

function fixture() {
  const firstReceipt = receipt({
    key: "RACEFILE01A:car33",
    at: 118,
    label: "CAR 33 LEAD CALL",
    entityIds: ["driver:car-33"],
    signalScore: 88,
    signalBasis: "caption-derived-heat",
  });
  const pulseReceipt = receipt({
    key: "RACEFILE01A:three-wide",
    at: 164,
    label: "THREE WIDE BATTLE",
    entityIds: [],
    excerpt: "The field stacks up into a three wide fight.",
    signalScore: 72,
    signalBasis: "caption-derived-heat",
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
        receipts: [firstReceipt, pulseReceipt],
        entities: [
          {
            id: "driver:car-33",
            label: "Car 33",
            type: "driver",
            basis: "timestamped-receipt",
            receiptKeys: [firstReceipt.key],
          },
        ],
        showWiki: {
          label: "SHOW WIKI",
          status: "distilled",
          description: "Source-local evidence organized for this broadcast.",
          experience: {
            id: "race-in-two-calls",
            label: "RACE IN TWO CALLS",
            title: "THE BROADCAST FAST PATH",
            description: "A bounded route through two registered race calls.",
            selectionBasis: "source-local caption signal",
            emptyState: "No source-local route is registered yet.",
            routeReceiptKeys: [firstReceipt.key, pulseReceipt.key],
            pulseReceiptKeys: [pulseReceipt.key],
            queryAliases: ["play the fast path"],
          },
          recap: {
            format: "source-receipt-recap",
            formatBasis: "caption-backed local receipt synthesis",
            overview: "The race file centers on a lead call and a three-wide battle.",
            queryAliases: ["summarize this race"],
            blocks: [
              {
                id: "lead-change",
                label: "LEAD CHANGE",
                body: "Car 33 reaches the lead in a timed booth receipt.",
                basis: "source-local timed caption receipt",
                receiptKeys: [firstReceipt.key],
              },
              {
                id: "field-battle",
                label: "FIELD BATTLE",
                body: "The field forms a three-wide fight shortly afterward.",
                basis: "source-local timed caption receipt",
                receiptKeys: [pulseReceipt.key],
              },
            ],
          },
          lanes: [
            {
              id: "best-moments",
              label: "BEST MOMENTS",
              description: "Ranked local moment receipts.",
              emptyState: "No ranked moment receipt is registered yet.",
              queryAliases: ["best race moments"],
              receiptKeys: [firstReceipt.key],
            },
          ],
        },
        artifacts: [
          {
            id: "race-cut:car-33-season",
            kind: "supercut-draft",
            label: "CAR 33 SEASON CUT",
            authority: "creator-draft",
            reviewState: "human-review-required",
            sourceIds: ["RACEFILE01A", "RACEFILE02B"],
            receiptKeys: [firstReceipt.key],
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
        artifacts: [
          {
            id: "race-cut:car-33-season",
            kind: "supercut-draft",
            label: "CAR 33 SEASON CUT",
            authority: "creator-draft",
            reviewState: "human-review-required",
            sourceIds: ["RACEFILE01A", "RACEFILE02B"],
            receiptKeys: [secondReceipt.key],
            at: 3590,
            targetSection: "clip-lab",
            risk: "MEDIUM",
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
        showWiki: {
          label: "SHOW WIKI",
          status: "source-brief",
          description: "Navigational shell only; this source is not distilled.",
          brief: {
            kind: "source-metadata-brief",
            scope: "canonical-source-metadata-only",
            format: "PREVIEW SHOW",
            formatBasis: "source-title-metadata",
            queryAliases: ["show source brief", "what can you prove"],
          },
          lanes: [
            {
              id: "best-moments",
              label: "BEST MOMENTS",
              description: "Ranked local moment receipts when evidence exists.",
              emptyState: "No source-local moment receipt is registered yet.",
              receiptKeys: [],
            },
          ],
        },
      }),
    ],
  };
}

function appendLocalReceipts(input, count, prefix) {
  const keys = [];
  for (let index = 0; index < count; index += 1) {
    const key = `RACEFILE01A:${prefix}-${String(index).padStart(2, "0")}`;
    input.sources[0].receipts.push(receipt({
      key,
      at: 300 + (index * 40),
      label: `${prefix.toUpperCase()} LIMIT RECEIPT ${index + 1}`,
      entityIds: [],
      excerpt: "A bounded source local archive signal is registered here.",
    }));
    keys.push(key);
  }
  return keys;
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

  assert.equal(engine.version, api.VERSION);
  assert.match(engine.version, /^\d+\.\d+\.\d+$/);
  assert.equal(engine.getStats().sources, 3);
  assert.equal(dossier.source.receipts.length, 2);
  assert.equal(dossier.source.receipts[0].signalScore, 88);
  assert.equal(dossier.source.receipts[0].signalBasis, "caption-derived-heat");
  assert.deepEqual(dossier.source.showWiki.experience.routeReceiptKeys, [
    "RACEFILE01A:car33",
    "RACEFILE01A:three-wide",
  ]);
  assert.deepEqual(dossier.source.showWiki.experience.pulseReceiptKeys, [
    "RACEFILE01A:three-wide",
  ]);
  assert.deepEqual(dossier.source.showWiki.experience.queryAliases, [
    "play the fast path",
  ]);
  assert.equal(dossier.source.showWiki.recap.format, "source-receipt-recap");
  assert.deepEqual(dossier.source.showWiki.recap.queryAliases, [
    "summarize this race",
  ]);
  assert.deepEqual(dossier.source.showWiki.recap.blocks.map((block) => block.id), [
    "lead-change",
    "field-battle",
  ]);
  assert.deepEqual(dossier.source.showWiki.lanes[0].receiptKeys, [
    "RACEFILE01A:car33",
  ]);
  assert.deepEqual(dossier.source.showWiki.lanes[0].queryAliases, [
    "best race moments",
  ]);
  assert.equal(dossier.wake.total, 2);
  assert.equal(dossier.wake.matchingTotal, 2);
  assert.equal(dossier.wake.displayed, 2);
  assert.equal(dossier.wake.truncated, false);
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

test("retains the 16-result Wake display cap while exposing the true match total", () => {
  const input = fixture();
  input.sources[0].artifacts = [];
  input.sources[1].artifacts = [];
  input.sources[1].entities = [];
  input.sources[2].entities = [];

  for (let index = 0; index < 20; index += 1) {
    input.sources.push(source({
      id: `CAP${String(index).padStart(8, "0")}`,
      title: `Car 33 archive neighbor ${index}`,
      date: "2026-07-10",
      coverage: "metadata-only",
      authority: "source-only",
      entities: [{
        id: "driver:car-33",
        label: "Car 33",
        type: "driver",
        basis: "cached-title-alias",
        receiptKeys: [],
      }],
    }));
  }

  const dossier = clone(runtime().create(input).build("RACEFILE01A"));

  assert.equal(dossier.wake.total, 20);
  assert.equal(dossier.wake.matchingTotal, 20);
  assert.equal(dossier.wake.displayed, 16);
  assert.equal(dossier.wake.truncated, true);
  assert.equal(dossier.wake.later.length + dossier.wake.earlier.length, 16);
});

test("accepts honest character signal/context evidence without promoting it", () => {
  const api = runtime();

  for (const evidenceType of [
    "caption-character-signal",
    "caption-character-context",
  ]) {
    const input = fixture();
    input.sources[0].receipts[0].evidenceType = evidenceType;
    assert.doesNotThrow(() => api.create(input), evidenceType);
  }

  const unknown = fixture();
  unknown.sources[0].receipts[0].evidenceType = "curated-character-reference";
  assert.throws(() => api.create(unknown), expectCode("UNKNOWN_EVIDENCE_TYPE"));
});

test("accepts the title, timeline, and reviewed-negative receipt types used by live Show Wikis", () => {
  const api = runtime();

  for (const evidenceType of [
    "caption-title-topic-receipt",
    "reviewed-guide-negative-take",
  ]) {
    const input = fixture();
    input.sources[0].receipts[0].evidenceType = evidenceType;
    assert.doesNotThrow(() => api.create(input), evidenceType);
  }

  const timeline = fixture();
  timeline.sources[0].receipts[0].evidenceType =
    "caption-topic-timeline-navigation";
  timeline.sources[0].receipts[0].excerpt = "";
  timeline.sources[0].receipts[0].publicExcerptAllowed = false;
  assert.doesNotThrow(
    () => api.create(timeline),
    "caption-topic-timeline-navigation",
  );

  const screened = fixture();
  screened.sources[0].receipts[0].steveEvidenceState =
    "strict-source-bounded-negative-take";
  screened.sources[0].receipts[0].editorNote =
    "The exact complaint was screened against this source cut.";
  const built = clone(api.create(screened).build("RACEFILE01A"));
  assert.equal(
    built.source.receipts[0].steveEvidenceState,
    "strict-source-bounded-negative-take",
  );
  assert.equal(
    built.source.receipts[0].editorNote,
    "The exact complaint was screened against this source cut.",
  );
});

test("exports exact coordinates and bindings without excerpts, captions, media, or speakers", () => {
  const manifest = clone(runtime().create(fixture()).exportManifest("RACEFILE01A"));
  const serialized = JSON.stringify(manifest);

  assert.equal(manifest.schema, "shokker-source-dossier-export/v1");
  assert.equal(manifest.source.id, "RACEFILE01A");
  assert.equal(manifest.receipts[0].at, 118);
  assert.equal(manifest.receipts[0].speaker, null);
  assert.equal(manifest.receipts[0].signalScore, 88);
  assert.equal(manifest.receipts[0].signalBasis, "caption-derived-heat");
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
  assert.equal(dossier.source.showWiki.status, "source-brief");
  assert.deepEqual(
    dossier.source.showWiki.brief,
    {
      kind: "source-metadata-brief",
      scope: "canonical-source-metadata-only",
      format: "PREVIEW SHOW",
      formatBasis: "source-title-metadata",
      queryAliases: ["show source brief", "what can you prove"],
    },
  );
  assert.deepEqual(dossier.source.showWiki.lanes[0].receiptKeys, []);
  assert.match(dossier.proof.evidenceBoundary, /No topic, quote, character/i);
  assert.ok(dossier.wake.earlier.length >= 1);
  assert.ok(dossier.wake.earlier.every((connection) => (
    connection.basis === "source-metadata-neighbor"
  )));
});

test("preserves a playable official alternate without crossing its timestamp boundary", () => {
  const input = fixture();
  input.sources[2].exactSourceHold = {
    state: "held-age-gated",
    reason: "The exact YouTube edit requires age-authenticated access.",
  };
  input.sources[2].officialAlternate = {
    kind: "official-podcast-edition",
    title: "Official alternate commentary",
    episodeUrl: "https://podcasters.spotify.com/pod/show/example/episodes/tape",
    enclosureUrl: "https://traffic.megaphone.fm/EXAMPLE.mp3",
    duration: 4305.61,
    canonicalDuration: 4200,
    durationDelta: 105.61,
    timestampIsomorphic: false,
    publicPlaybackAllowed: true,
    evidenceBoundary: "Official alternate edit; not a canonical timestamp source.",
  };

  const engine = runtime().create(input);
  const dossier = clone(engine.build("RACEFILE03C"));
  assert.equal(dossier.source.exactSourceHold.state, "held-age-gated");
  assert.equal(dossier.source.officialAlternate.timestampIsomorphic, false);
  assert.equal(dossier.source.officialAlternate.durationDelta, 105.61);
  assert.match(dossier.source.officialAlternate.enclosureUrl, /^https:/);
  assert.equal(dossier.source.receipts.length, 0);

  const manifest = clone(engine.exportManifest("RACEFILE03C"));
  assert.deepEqual(manifest.source.exactSourceHold, input.sources[2].exactSourceHold);
  assert.deepEqual(manifest.source.officialAlternate, input.sources[2].officialAlternate);
  assert.equal(manifest.source.officialAlternate.timestampIsomorphic, false);
  assert.equal(manifest.source.officialAlternate.publicPlaybackAllowed, true);

  const changed = fixture();
  changed.sources[2].exactSourceHold = clone(input.sources[2].exactSourceHold);
  changed.sources[2].officialAlternate = {
    ...input.sources[2].officialAlternate,
    episodeUrl: "https://podcasters.spotify.com/pod/show/example/episodes/other",
  };
  const changedDossier = clone(runtime().create(changed).build("RACEFILE03C"));
  assert.notEqual(
    changedDossier.source.sourceFingerprint,
    dossier.source.sourceFingerprint,
  );

  const matched = fixture();
  matched.sources[2].officialAlternate = {
    ...input.sources[2].officialAlternate,
    duration: 4199.71,
    canonicalDuration: 4200,
    durationDelta: 0.29,
    timestampIsomorphic: true,
  };
  const matchedDossier = clone(runtime().create(matched).build("RACEFILE03C"));
  assert.equal(matchedDossier.source.officialAlternate.timestampIsomorphic, true);
  assert.equal(matchedDossier.source.officialAlternate.durationDelta, 0.29);

  const crossed = fixture();
  crossed.sources[2].officialAlternate = {
    ...matched.sources[2].officialAlternate,
    durationDelta: 1.01,
  };
  assert.throws(
    () => runtime().create(crossed),
    expectCode("ALTERNATE_SOURCE_TIMELINE"),
  );

  const unsafe = fixture();
  unsafe.sources[2].officialAlternate = {
    ...input.sources[2].officialAlternate,
    enclosureUrl: "javascript:alert(1)",
  };
  assert.throws(
    () => runtime().create(unsafe),
    expectCode("INVALID_HTTPS_URL"),
  );
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

test("validates bounded signal scores and source-local generic Show Wiki lanes", () => {
  const api = runtime();

  for (const score of [-1, 100.01, "not-a-score"]) {
    const invalid = fixture();
    invalid.sources[0].receipts[0].signalScore = score;
    assert.throws(() => api.create(invalid), expectCode("INVALID_SIGNAL_SCORE"));
  }

  const missingBasis = fixture();
  missingBasis.sources[0].receipts[0].signalBasis = null;
  assert.throws(() => api.create(missingBasis), expectCode("REQUIRED_TEXT"));

  const orphanBasis = fixture();
  orphanBasis.sources[1].receipts[0].signalBasis = "caption-derived-heat";
  assert.throws(
    () => api.create(orphanBasis),
    expectCode("SIGNAL_BASIS_WITHOUT_SCORE"),
  );

  const foreignReceipt = fixture();
  foreignReceipt.sources[0].showWiki.lanes[0].receiptKeys = [
    "RACEFILE02B:car33",
  ];
  assert.throws(
    () => api.create(foreignReceipt),
    expectCode("UNKNOWN_SHOW_WIKI_RECEIPT"),
  );

  const duplicateLane = fixture();
  duplicateLane.sources[0].showWiki.lanes.push(
    clone(duplicateLane.sources[0].showWiki.lanes[0]),
  );
  assert.throws(
    () => api.create(duplicateLane),
    expectCode("DUPLICATE_SHOW_WIKI_LANE"),
  );

  const invalidLaneId = fixture();
  invalidLaneId.sources[0].showWiki.lanes[0].id = "Best Moments";
  assert.throws(
    () => api.create(invalidLaneId),
    expectCode("INVALID_SHOW_WIKI_LANE_ID"),
  );

  const duplicateAlias = fixture();
  duplicateAlias.sources[0].showWiki.lanes[0].queryAliases = [
    "Best race moments",
    "best   race moments",
  ];
  assert.throws(
    () => api.create(duplicateAlias),
    expectCode("DUPLICATE_SHOW_WIKI_QUERY_ALIAS"),
  );

  const aliasLimit = fixture();
  aliasLimit.sources[0].showWiki.lanes[0].queryAliases = Array.from(
    { length: 17 },
    (_, index) => `lane question ${index}`,
  );
  assert.throws(
    () => api.create(aliasLimit),
    expectCode("SHOW_WIKI_QUERY_ALIAS_LIMIT"),
  );
});

test("fails closed on Show Wiki experience and recap contract violations", () => {
  const api = runtime();

  for (const field of ["routeReceiptKeys", "pulseReceiptKeys"]) {
    const foreignExperienceKey = fixture();
    foreignExperienceKey.sources[0].showWiki.experience[field] = [
      "RACEFILE02B:car33",
    ];
    assert.throws(
      () => api.create(foreignExperienceKey),
      expectCode("UNKNOWN_SHOW_WIKI_EXPERIENCE_RECEIPT"),
      field,
    );

    const duplicateExperienceKey = fixture();
    duplicateExperienceKey.sources[0].showWiki.experience[field] = [
      "RACEFILE01A:car33",
      "RACEFILE01A:car33",
    ];
    assert.throws(
      () => api.create(duplicateExperienceKey),
      expectCode("DUPLICATE_VALUE"),
      field,
    );
  }

  const invalidExperienceId = fixture();
  invalidExperienceId.sources[0].showWiki.experience.id = "Race In Two Calls";
  assert.throws(
    () => api.create(invalidExperienceId),
    expectCode("INVALID_SHOW_WIKI_EXPERIENCE_ID"),
  );

  const routeLimit = fixture();
  routeLimit.sources[0].showWiki.experience.routeReceiptKeys =
    appendLocalReceipts(routeLimit, 9, "route");
  assert.throws(
    () => api.create(routeLimit),
    expectCode("SHOW_WIKI_EXPERIENCE_ROUTE_LIMIT"),
  );

  const pulseLimit = fixture();
  pulseLimit.sources[0].showWiki.experience.pulseReceiptKeys =
    appendLocalReceipts(pulseLimit, 33, "pulse");
  assert.throws(
    () => api.create(pulseLimit),
    expectCode("SHOW_WIKI_EXPERIENCE_PULSE_LIMIT"),
  );

  const foreignRecapKey = fixture();
  foreignRecapKey.sources[0].showWiki.recap.blocks[0].receiptKeys = [
    "RACEFILE02B:car33",
  ];
  assert.throws(
    () => api.create(foreignRecapKey),
    expectCode("UNKNOWN_SHOW_WIKI_RECAP_RECEIPT"),
  );

  const missingRecapKeys = fixture();
  delete missingRecapKeys.sources[0].showWiki.recap.blocks[0].receiptKeys;
  assert.throws(
    () => api.create(missingRecapKeys),
    expectCode("REQUIRED_LIST"),
  );

  const duplicateRecapBlock = fixture();
  duplicateRecapBlock.sources[0].showWiki.recap.blocks.push(
    clone(duplicateRecapBlock.sources[0].showWiki.recap.blocks[0]),
  );
  assert.throws(
    () => api.create(duplicateRecapBlock),
    expectCode("DUPLICATE_SHOW_WIKI_RECAP_BLOCK"),
  );

  const invalidRecapBlockId = fixture();
  invalidRecapBlockId.sources[0].showWiki.recap.blocks[0].id = "Lead Change";
  assert.throws(
    () => api.create(invalidRecapBlockId),
    expectCode("INVALID_SHOW_WIKI_RECAP_BLOCK_ID"),
  );

  const recapBlockLimit = fixture();
  recapBlockLimit.sources[0].showWiki.recap.blocks.push(
    {
      id: "strategy-window",
      label: "STRATEGY WINDOW",
      body: "A third source-local recap block.",
      basis: "source-local timed caption receipt",
      receiptKeys: ["RACEFILE01A:car33"],
    },
    {
      id: "restart-window",
      label: "RESTART WINDOW",
      body: "A fourth source-local recap block.",
      basis: "source-local timed caption receipt",
      receiptKeys: ["RACEFILE01A:three-wide"],
    },
    {
      id: "finish-window",
      label: "FINISH WINDOW",
      body: "A fifth block exceeds the bounded recap contract.",
      basis: "source-local timed caption receipt",
      receiptKeys: ["RACEFILE01A:car33"],
    },
  );
  assert.throws(
    () => api.create(recapBlockLimit),
    expectCode("SHOW_WIKI_RECAP_BLOCKS_REQUIRED"),
  );

  const metadataExperienceOverreach = fixture();
  metadataExperienceOverreach.sources[2].showWiki.experience = clone(
    metadataExperienceOverreach.sources[0].showWiki.experience,
  );
  assert.throws(
    () => api.create(metadataExperienceOverreach),
    expectCode("UNKNOWN_SHOW_WIKI_EXPERIENCE_RECEIPT"),
  );

  const metadataRecapOverreach = fixture();
  metadataRecapOverreach.sources[2].showWiki.recap = clone(
    metadataRecapOverreach.sources[0].showWiki.recap,
  );
  assert.throws(
    () => api.create(metadataRecapOverreach),
    expectCode("UNKNOWN_SHOW_WIKI_RECAP_RECEIPT"),
  );
});

test("Source Brief accepts only canonical metadata and fails closed on semantic overreach", () => {
  const api = runtime();

  for (const [field, value] of [
    ["overview", "An invented content overview."],
    ["body", "An invented content body."],
    ["summary", "An invented content summary."],
    ["receiptKeys", []],
  ]) {
    const semanticOverreach = fixture();
    semanticOverreach.sources[2].showWiki.brief[field] = value;
    assert.throws(
      () => api.create(semanticOverreach),
      expectCode("SHOW_WIKI_BRIEF_FIELD_OVERREACH"),
      field,
    );
  }

  for (const [field, value, code] of [
    ["kind", "episode-summary", "INVALID_SHOW_WIKI_BRIEF_KIND"],
    ["scope", "semantic-content", "INVALID_SHOW_WIKI_BRIEF_SCOPE"],
    ["formatBasis", "machine-inferred-from-content", "INVALID_SHOW_WIKI_BRIEF_FORMAT_BASIS"],
  ]) {
    const invalidIdentity = fixture();
    invalidIdentity.sources[2].showWiki.brief[field] = value;
    assert.throws(() => api.create(invalidIdentity), expectCode(code), field);
  }

  const noAliases = fixture();
  noAliases.sources[2].showWiki.brief.queryAliases = [];
  assert.throws(
    () => api.create(noAliases),
    expectCode("SHOW_WIKI_BRIEF_QUERY_ALIASES_REQUIRED"),
  );

  const captionBackedBrief = fixture();
  captionBackedBrief.sources[0].showWiki.brief = clone(
    captionBackedBrief.sources[2].showWiki.brief,
  );
  captionBackedBrief.sources[0].showWiki.status = "source-brief";
  assert.throws(
    () => api.create(captionBackedBrief),
    expectCode("COVERAGE_SHOW_WIKI_BRIEF_MISMATCH"),
  );

  const staleStatus = fixture();
  staleStatus.sources[2].showWiki.status = "queued";
  assert.throws(
    () => api.create(staleStatus),
    expectCode("SHOW_WIKI_BRIEF_STATUS_MISMATCH"),
  );

  const missingBrief = fixture();
  missingBrief.sources[2].showWiki.brief = null;
  assert.throws(
    () => api.create(missingBrief),
    expectCode("SHOW_WIKI_BRIEF_STATUS_MISMATCH"),
  );
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

test("requires artifact receipts to stay on their exact local owner copy", () => {
  const input = fixture();
  input.sources[0].artifacts[0].receiptKeys = ["RACEFILE02B:car33"];

  assert.throws(
    () => runtime().create(input),
    expectCode("FOREIGN_ARTIFACT_RECEIPT"),
  );
});

test("requires every declared cross-source artifact membership to have an owner copy", () => {
  const input = fixture();
  input.sources[1].artifacts = [];

  assert.throws(
    () => runtime().create(input),
    expectCode("MISSING_ARTIFACT_OWNER_COPY"),
  );
});

test("rejects identity and membership drift across cross-source artifact copies", () => {
  const identityDrift = fixture();
  identityDrift.sources[1].artifacts[0].label = "A DIFFERENT SEASON CUT";
  assert.throws(
    () => runtime().create(identityDrift),
    expectCode("ARTIFACT_IDENTITY_MISMATCH"),
  );

  const membershipDrift = fixture();
  membershipDrift.sources[1].artifacts[0].sourceIds = ["RACEFILE02B"];
  assert.throws(
    () => runtime().create(membershipDrift),
    expectCode("ARTIFACT_MEMBERSHIP_MISMATCH"),
  );
});
