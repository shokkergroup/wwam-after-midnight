import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const demo = path.join(here, "..", "public", "demo");

function load() {
  const context = { window: {} };
  context.globalThis = context.window;
  vm.createContext(context);
  for (const file of [
    "catalog.js",
    "deep-distill.js",
    "livestream-distill.js",
    "popular-live-distill.js",
    "curation.js",
    "character-lore.js",
    "wwam-channel-dna.js",
    "archive-atlas-data.js",
    "showcase-engine.js",
    "lore-engine.js",
    "red-band-ranking-v2.js",
    "tape-companion-engine.js"
  ]) {
    vm.runInContext(fs.readFileSync(path.join(demo, file), "utf8"), context, {
      filename: file
    });
  }
  return context.window;
}

function serial(value) {
  return JSON.parse(JSON.stringify(value));
}

function createFull() {
  const window = load();
  const showcase = window.WWAMShowcaseEngine.create({
    catalog: window.WWAM_CATALOG,
    deep: window.WWAM_DEEP_DISTILL,
    live: window.WWAM_LIVESTREAMS,
    popular: window.WWAM_POPULAR_LIVE,
    characters: window.WWAM_CHARACTER_LORE,
    dna: window.WWAM_CHANNEL_DNA
  });
  const lore = window.WWAMLoreEngine.create({
    catalog: window.WWAM_CATALOG,
    deep: window.WWAM_DEEP_DISTILL,
    live: window.WWAM_LIVESTREAMS,
    popular: window.WWAM_POPULAR_LIVE,
    characters: window.WWAM_CHARACTER_LORE
  });
  const redBand = window.WWAMRedBandRankingV2.create({
    catalog: window.WWAM_CATALOG,
    deep: window.WWAM_DEEP_DISTILL,
    live: window.WWAM_LIVESTREAMS,
    popular: window.WWAM_POPULAR_LIVE,
    curation: window.WWAM_CURATED,
    characters: window.WWAM_CHARACTER_LORE
  });
  const inputs = {
    showcase,
    deep: window.WWAM_DEEP_DISTILL,
    live: window.WWAM_LIVESTREAMS,
    popular: window.WWAM_POPULAR_LIVE,
    curation: window.WWAM_CURATED,
    characters: window.WWAM_CHARACTER_LORE,
    lore,
    redBand
  };
  const companion = window.WWAMTapeCompanionEngine.create(inputs);
  return { window, showcase, lore, redBand, inputs, companion };
}

function neutralInputs(overrides = {}) {
  return {
    channelId: "neutral-racing",
    snapshotDate: "2026-07-24",
    archiveFingerprint: "neutral-racing-snapshot",
    labels: {
      ready: "RACE COMPANION READY",
      limited: "BROADCAST RECORD ONLY",
      receipt: "RACE RECEIPT",
      topic: "RACE TOPIC SIGNAL",
      heat: "BOOTH INTENSITY WINDOW",
      character: "PARTICIPANT SIGNAL",
      rankedCandidate: "MEMORABLE RACE CANDIDATE",
      editorialSelection: "EDITOR'S RACE PICK",
      archiveConnection: "RACE HISTORY CONNECTION"
    },
    sources: [
      {
        id: "race-broadcast-1",
        title: "Wednesday Championship Broadcast",
        date: "2026-07-22",
        type: "race-broadcast",
        lane: "wednesday-race",
        lanes: ["wednesday-race"],
        duration: 120,
        captioned: true,
        url: "https://www.youtube.com/watch?v=race-broadcast-1",
        heatmap: [
          {
            from: 0,
            to: 60,
            heat: 45,
            signal: "GREEN-FLAG BUILD",
            model: "booth-intensity"
          },
          {
            from: 60,
            to: 120,
            heat: 94,
            signal: "LAST-LAP PRESSURE",
            model: "booth-intensity"
          }
        ],
        topics: [
          {
            name: "Pit strategy",
            peak: 35,
            receipt: "The indexed booth fragment turns toward the final pit cycle."
          }
        ]
      }
    ],
    receipts: [
      {
        id: "race-receipt-1",
        sourceId: "race-broadcast-1",
        t: 10,
        category: "LEAD CHANGE",
        excerpt:
          "The outside lane carries momentum and the lead changes at the line for another lap.",
        entityIds: ["driver:alpha"]
      },
      {
        id: "race-receipt-2",
        sourceId: "race-broadcast-1",
        t: 14,
        category: "PARTICIPANT SIGNAL",
        excerpt:
          "The field responds immediately as the new leader protects the bottom through traffic.",
        entityIds: ["driver:alpha"]
      },
      {
        id: "race-receipt-3",
        sourceId: "race-broadcast-1",
        t: 75,
        category: "CLOSE FINISH",
        excerpt:
          "Two trucks reach the final corner together with almost no daylight between them.",
        entityIds: ["driver:alpha", "driver:bravo"]
      }
    ],
    heatWindows: [
      {
        sourceId: "race-broadcast-1",
        from: 0,
        to: 60,
        heat: 45,
        signal: "GREEN-FLAG BUILD",
        model: "booth-intensity"
      },
      {
        sourceId: "race-broadcast-1",
        from: 60,
        to: 120,
        heat: 94,
        signal: "LAST-LAP PRESSURE",
        model: "booth-intensity"
      }
    ],
    ...overrides
  };
}

function fnv(value) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return ("00000000" + (hash >>> 0).toString(16)).slice(-8);
}

function decodeToken(token) {
  const [, encoded] = token.match(/^tc1\.([^.]+)\.[0-9a-f]{8}$/);
  return JSON.parse(decodeURIComponent(encoded));
}

function encodeToken(payload) {
  const stable = (value) => {
    if (Array.isArray(value)) return value.map(stable);
    if (value && typeof value === "object") {
      return Object.keys(value).sort().reduce((result, key) => {
        result[key] = stable(value[key]);
        return result;
      }, {});
    }
    return value;
  };
  const encoded = encodeURIComponent(JSON.stringify(stable(payload))).replace(
    /\./g,
    "%2E"
  );
  return `tc1.${encoded}.${fnv(encoded)}`;
}

function excerptWords(value) {
  return String(value || "")
    .replace(/\s+\u2026$/, "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
}

const full = createFull();

function createCanonicalRegistryCompanion() {
  const atlasSources = full.window.WWAM_ARCHIVE_ATLAS.records.map((record) => {
    const lanes = Array.isArray(record.lanes) ? [...record.lanes] : [];
    return {
      id: record.id,
      title: record.title,
      date: record.date,
      durationSeconds: record.duration,
      type: lanes.includes("commentary-catalog") ? "commentary" : "livestream",
      lane: lanes[0] || "archive-metadata",
      lanes,
      url: record.url,
      captioned: record.coverage === "deeply-indexed",
    };
  });
  return full.window.WWAMTapeCompanionEngine.create({
    ...full.inputs,
    sources: full.showcase.sources.concat(atlasSources),
  });
}

test("publishes the complete pure API and full promoted-corpus readiness boundary", () => {
  const { window, companion } = full;

  assert.equal(window.WWAMTapeCompanionEngine.VERSION, "1.1.0");
  assert.equal(
    window.WWAMTapeCompanionEngine,
    window.YouTubeWikiTapeCompanionEngine
  );
  assert.equal(companion.schema, "youtube-wiki-tape-companion/v1");
  assert.equal(
    companion.shareSchema,
    "youtube-wiki-tape-companion-share/v1"
  );
  assert.equal(companion.channelId, "wwam");
  assert.equal(companion.snapshotDate, "2026-07-23");
  assert.deepEqual(
    Object.keys(companion).sort(),
    [
      "archiveFingerprint",
      "channelId",
      "compileTimeline",
      "crossedEvents",
      "engine",
      "evidencePolicy",
      "getNextMarker",
      "labels",
      "listSources",
      "metrics",
      "restoreShareState",
      "schema",
      "serializeShareState",
      "shareSchema",
      "snapshotAt",
      "snapshotDate",
      "version"
    ]
  );
  assert.equal(Object.isFrozen(companion), true);
  assert.equal(companion.metrics.sources, 74);
  assert.equal(companion.metrics.companionReady, 71);
  assert.equal(companion.metrics.limited, 3);
  assert.equal(companion.metrics.exactReceiptMembers, 877);
  assert.equal(companion.metrics.exactIncidents, 874);
  assert.equal(companion.metrics.heatWindows, 1294);
  assert.equal(companion.metrics.recurringCharacterAnnotations, 30);
  assert.equal(companion.metrics.editorialSelectionAnnotations, 25);
  assert.equal(companion.metrics.rankedCandidateAnnotations, 69);
  assert.equal(companion.metrics.loreConnections, 2987);
  assert.equal(companion.metrics.lorePerformanceConnections, 30);
  assert.equal(companion.metrics.loreContextConnections, 0);
  assert.equal(companion.metrics.loreMixedConnections, 0);
  assert.equal(companion.metrics.loreArchiveConnections, 2957);
  assert.equal(companion.metrics.lorePerformanceReceiptLinks, 30);
  assert.equal(companion.metrics.loreContextReceiptLinks, 0);
  assert.equal(companion.metrics.loreArchiveReceiptLinks, 2965);
  assert.equal(
    companion.metrics.lorePerformanceConnections +
      companion.metrics.loreContextConnections +
      companion.metrics.loreMixedConnections +
      companion.metrics.loreArchiveConnections,
    companion.metrics.loreConnections
  );
  assert.equal(companion.archiveFingerprint, full.showcase.inputFingerprint);
  assert.equal(companion.evidencePolicy.publicExcerptWordLimit, 16);
  assert.equal(companion.evidencePolicy.futureTextInSnapshots, false);
  assert.equal(companion.evidencePolicy.copiedMedia, false);
  assert.equal(companion.evidencePolicy.audioExtraction, false);
  assert.equal(companion.evidencePolicy.autoplay, false);
});

test("the canonical 510-source registry opens every dossier in Tape Companion without inventing timed memory", () => {
  const companion = createCanonicalRegistryCompanion();
  const sources = companion.listSources();
  const ready = sources.filter(
    (source) => source.readiness.status === "companion-ready",
  );
  const sourceOnly = sources.filter(
    (source) => source.readiness.status !== "companion-ready",
  );

  assert.equal(sources.length, 510);
  assert.equal(ready.length, 71);
  assert.equal(sourceOnly.length, 439);
  assert.equal(new Set(sources.map((source) => source.id)).size, 510);

  const metadataOnly = companion.compileTimeline("FVuwRHM0kcc");
  assert.ok(metadataOnly);
  assert.equal(metadataOnly.readiness.mode, "source-only");
  assert.equal(metadataOnly.readiness.allowsTimedClaims, false);
  assert.equal(metadataOnly.counts.exactReceiptMembers, 0);
  assert.equal(metadataOnly.counts.heatWindows, 0);
  assert.equal(metadataOnly.events.length, 0);

  const latest = companion.compileTimeline("LV2rmwEA0w4");
  assert.ok(latest);
  assert.equal(latest.readiness.mode, "source-synced-companion");
  assert.ok(latest.counts.exactReceiptMembers > 0);
});

test("all 74 promoted sources compile and only the three honest gaps are source-only", () => {
  const { companion } = full;
  const sources = companion.listSources();
  const ready = sources.filter(
    (source) => source.readiness.status === "companion-ready"
  );
  const limited = sources.filter(
    (source) => source.readiness.status === "limited"
  );

  assert.equal(sources.length, 74);
  assert.equal(ready.length, 71);
  assert.equal(limited.length, 3);
  assert.deepEqual(
    serial(limited.map((source) => source.id).sort()),
    ["AzrcgoyE7C4", "cQAVmNFQmoI", "x6tvsGRHgU0"]
  );

  for (const source of ready) {
    const timeline = companion.compileTimeline(source.id);
    assert.ok(timeline);
    assert.equal(timeline.readiness.status, "companion-ready");
    assert.equal(timeline.readiness.mode, "source-synced-companion");
    assert.equal(timeline.readiness.allowsTimedClaims, true);
    assert.ok(timeline.counts.exactReceiptMembers >= 8);
    assert.ok(timeline.counts.heatWindows >= 8);
  }

  for (const source of limited) {
    const timeline = companion.compileTimeline(source.id);
    assert.ok(timeline);
    assert.equal(timeline.readiness.mode, "source-only");
    assert.equal(timeline.readiness.allowsTimedClaims, false);
    assert.ok(
      timeline.readiness.reasons.includes("caption-evidence-unavailable")
    );
    assert.equal(timeline.counts.exactReceiptMembers, 0);
    assert.equal(timeline.counts.heatWindows, 0);
    assert.equal(timeline.events.length, 0);
  }
});

test("source listing is deterministic, filterable, and returns defensive copies", () => {
  const { companion } = full;
  const all = companion.listSources();
  const allAgain = companion.listSources();

  assert.deepEqual(all, allAgain);
  assert.equal(companion.listSources({ status: "companion-ready" }).length, 71);
  assert.equal(companion.listSources({ status: "limited" }).length, 3);
  assert.equal(companion.listSources({ lane: "commentary" }).length, 39);
  assert.equal(
    companion.listSources({ query: "jason lives" })[0].id,
    "BIbyzMlstmM"
  );
  assert.equal(companion.listSources({ limit: 5 }).length, 5);

  all[0].title = "MUTATED OUTSIDE THE ENGINE";
  all[0].readiness.status = "fake";
  assert.notEqual(
    companion.listSources()[0].title,
    "MUTATED OUTSIDE THE ENGINE"
  );
  assert.notEqual(companion.listSources()[0].readiness.status, "fake");
});

test("every timeline is ordered, in range, source-only, and publicly bounded", () => {
  const { companion } = full;

  for (const source of companion.listSources()) {
    const timeline = companion.compileTimeline(source.id);
    let lastAt = -1;
    for (const event of timeline.events) {
      assert.equal(event.sourceId, source.id);
      assert.ok(event.at >= lastAt);
      assert.ok(event.at >= 0);
      assert.ok(event.endAt >= event.at);
      if (source.durationSeconds) {
        assert.ok(event.at <= source.durationSeconds);
        assert.ok(event.endAt <= source.durationSeconds);
      }
      assert.equal(event.evidence.trueOriginClaim, false);
      assert.equal(event.evidence.syntheticQuote, false);
      assert.equal(event.evidence.speaker, null);
      assert.ok(excerptWords(event.excerpt).length <= 16);
      assert.doesNotMatch(event.url, /embed|autoplay/i);

      if (event.kind === "heat-window") {
        assert.equal(event.exact, false);
        assert.equal(event.derived, true);
        assert.deepEqual(serial(event.receiptIds), []);
        assert.ok(event.heat.score >= 0 && event.heat.score <= 100);
      } else {
        assert.equal(event.exact, true);
        assert.ok(event.receiptIds.length >= 1);
        assert.ok(event.members.length >= 1);
        for (const member of event.members) {
          assert.ok(member.at >= event.at);
          assert.ok(member.at <= event.endAt);
          assert.ok(member.receiptIds.length >= 1);
          assert.ok(excerptWords(member.excerpt).length <= 16);
          assert.equal(member.evidence.speaker, null);
        }
      }
      lastAt = event.at;
    }

    const text = JSON.stringify(timeline);
    assert.doesNotMatch(text, /youtube\.com\/embed/i);
    assert.doesNotMatch(text, /autoplay=1/i);
    assert.doesNotMatch(text, /"audio(?:Url|Data|Clip)"/i);
    assert.equal(timeline.source.playbackPolicy.officialSourceOnly, true);
    assert.equal(timeline.source.playbackPolicy.copiedMedia, false);
    assert.equal(timeline.source.playbackPolicy.audioExtraction, false);
    assert.equal(timeline.source.playbackPolicy.autoplay, false);
  }
});

test("the July 23 Loomis and Full Send receipts fuse without losing either exact second", () => {
  const { companion } = full;
  const timeline = companion.compileTimeline("LV2rmwEA0w4");
  const incident = timeline.events.find(
    (event) =>
      event.kind === "incident" &&
      event.timestamps.includes(9042.64) &&
      event.timestamps.includes(9046)
  );

  assert.ok(incident);
  assert.equal(incident.at, 9042.64);
  assert.equal(incident.endAt, 9046);
  assert.equal(incident.fused, true);
  assert.deepEqual(serial(incident.timestamps), [9042.64, 9046]);
  assert.deepEqual(
    serial(incident.receiptIds),
    [
      "character-receipt:loomis-funding",
      "LV2rmwEA0w4:moment:9046:full-send:0"
    ]
  );
  assert.deepEqual(
    serial(incident.labels),
    ["CHARACTER PERFORMANCE", "FULL SEND"]
  );
  assert.equal(incident.members.length, 2);

  const ranked = incident.annotations.find(
    (annotation) => annotation.type === "ranked-candidate"
  );
  assert.equal(ranked.rank, 38);
  assert.equal(ranked.selectionStatus, "machine-ranked");
  assert.match(ranked.semantics, /not an authenticated creator or editor verdict/);

  const character = incident.annotations.find(
    (annotation) => annotation.type === "recurring-character"
  );
  assert.equal(character.characterId, "loomis");
  assert.equal(character.ownerMapping.recurringPerformer, "J");
  assert.equal(character.ownerMapping.scope, "recurring-character-only");
  assert.equal(character.clipSpeaker, null);
  assert.equal(character.clipSpeakerStatus, "not-diarized");
  assert.match(character.semantics, /does not attribute the voice/);
  assert.equal(incident.evidence.speaker, null);

  const connection = incident.loreConnections.find(
    (candidate) => candidate.entryId === "character:loomis"
  );
  assert.ok(connection);
  assert.equal(connection.evidenceCount, 16);
  assert.equal(connection.sourceCount, 14);
  assert.equal(connection.performanceEvidenceCount, 15);
  assert.equal(connection.performanceSourceCount, 13);
  assert.equal(connection.contextEvidenceCount, 1);
  assert.equal(connection.contextSourceCount, 1);
  assert.equal(connection.archiveEvidenceCount, 0);
  assert.equal(connection.connectionRole, "performance-candidate");
  assert.equal(
    connection.connectionLabel,
    "PERFORMANCE-CANDIDATE ARCHIVE CONNECTION"
  );
  assert.deepEqual(serial(connection.supportReceiptIds), [
    "receipt:character-performance:LV2rmwEA0w4:90426:dr-loomis-bureaucratic-combat"
  ]);
  assert.deepEqual(
    serial(connection.supportPerformanceReceiptIds),
    serial(connection.supportReceiptIds)
  );
  assert.deepEqual(serial(connection.supportContextReceiptIds), []);
  const contextReceiptId =
    "receipt:creator-context:sdiVxLTq67Q:105178:dr-loomis-creator-context";
  assert.deepEqual(serial(connection.relatedContextReceiptIds), [
    contextReceiptId
  ]);
  assert.equal(connection.earliestIndexed.date, "2022-08-20");
  assert.equal(
    connection.earliestIndexed.receiptId,
    "receipt:character-performance:WyT--HIrL8U:80573:dr-loomis-apocalyptic-certainty"
  );
  assert.equal(connection.earliestIndexed.role, "performance-candidate");
  assert.equal(
    connection.earliestIndexed.label,
    "EARLIEST INDEXED PERFORMANCE CANDIDATE"
  );
  assert.equal(
    connection.chronologyBasis,
    "timestamp-validated-curated-performance-candidates-only"
  );
  assert.deepEqual(
    serial(connection.earliestIndexedPerformance),
    serial(connection.earliestIndexed)
  );
  assert.equal(connection.earliestIndexed.trueOriginClaim, false);
  assert.notEqual(connection.earliestIndexed.receiptId, contextReceiptId);
  const contextReceipt = full.lore.getReceipt(contextReceiptId);
  assert.equal(contextReceipt.date, "2022-01-11");
  assert.equal(contextReceipt.kind, "creator-context");
  assert.ok(connection.relatedReceiptIds.includes(contextReceiptId));
  assert.equal(
    connection.relatedPerformanceReceiptIds.includes(contextReceiptId),
    false
  );
  assert.match(connection.semantics, /matched receipt ID/);
  assert.match(connection.semantics, /performance candidates only/);
});

test("snapshotAt hides every future member, label, excerpt, and annotation", () => {
  const { companion } = full;
  const beforeFullSend = companion.snapshotAt("LV2rmwEA0w4", 9043);
  const active = beforeFullSend.activeEvents.find(
    (event) => event.id === "incident:837d5f44"
  );

  assert.ok(active);
  assert.equal(active.partiallyRevealed, true);
  assert.equal(active.hiddenMemberCount, 1);
  assert.equal(active.members.length, 1);
  assert.equal(active.latestRevealedMemberId, active.members[0].id);
  assert.deepEqual(serial(active.timestamps), [9042.64]);
  assert.deepEqual(serial(active.labels), ["CHARACTER PERFORMANCE"]);
  assert.doesNotMatch(JSON.stringify(active), /FULL SEND/);
  assert.ok(
    active.members.every(
      (member) =>
        !/full-send/i.test(`${member.id} ${member.label} ${member.excerpt}`)
    )
  );
  assert.equal(
    active.annotations.find(
      (annotation) => annotation.type === "ranked-candidate"
    ).rank,
    38
  );

  assert.deepEqual(serial(beforeFullSend.future.next), {
    eventId: "incident:837d5f44",
    at: 9046,
    secondsUntil: 3,
    reveal: "hidden-until-crossed"
  });
  assert.equal(beforeFullSend.future.textIncluded, false);
  assert.deepEqual(Object.keys(beforeFullSend.future.next).sort(), [
    "at",
    "eventId",
    "reveal",
    "secondsUntil"
  ]);
  assert.doesNotMatch(JSON.stringify(beforeFullSend.future), /FULL SEND|funding/i);

  const afterFullSend = companion.snapshotAt("LV2rmwEA0w4", 9047);
  const revealed = afterFullSend.activeEvents.find(
    (event) => event.id === active.id
  );
  assert.equal(revealed.partiallyRevealed, false);
  assert.equal(revealed.hiddenMemberCount, 0);
  assert.equal(revealed.members.length, 2);
  assert.deepEqual(serial(revealed.timestamps), [9042.64, 9046]);
  assert.ok(revealed.labels.includes("FULL SEND"));
  const latest = revealed.members.find(
    (member) => member.id === revealed.latestRevealedMemberId
  );
  assert.ok(latest);
  assert.equal(latest.at, 9046);
  assert.equal(latest.label, "FULL SEND");
  assert.equal(
    revealed.annotations.find(
      (annotation) => annotation.type === "ranked-candidate"
    ).rank,
    38
  );
  assert.equal(
    revealed.annotations.find(
      (annotation) => annotation.type === "recurring-character"
    ).characterId,
    "loomis"
  );

  for (const snapshot of [
    companion.snapshotAt("LV2rmwEA0w4", 0),
    beforeFullSend,
    afterFullSend,
    companion.snapshotAt("LV2rmwEA0w4", 12785)
  ]) {
    for (const event of snapshot.activeEvents.concat(snapshot.history)) {
      for (const member of event.members) {
        assert.ok(member.at <= snapshot.seconds);
        for (const annotation of member.annotations) {
          assert.ok(annotation.at <= snapshot.seconds);
        }
      }
    }
  }
});

test("active derived heat keeps its numeric score while sealing whole-window text", () => {
  const { window } = full;
  const companion = window.WWAMTapeCompanionEngine.create(neutralInputs());
  const firstWindow = companion.snapshotAt("race-broadcast-1", 20).currentHeat;
  const secondWindow = companion.snapshotAt("race-broadcast-1", 75).currentHeat;

  assert.equal(firstWindow.label, "BOOTH INTENSITY WINDOW");
  assert.equal(firstWindow.heat.score, 45);
  assert.equal(firstWindow.heat.signal, null);
  assert.equal(firstWindow.heat.topic, null);
  assert.equal(firstWindow.textStatus, "sealed-until-window-complete");
  assert.doesNotMatch(JSON.stringify(firstWindow), /GREEN-FLAG BUILD/);

  assert.equal(secondWindow.heat.score, 94);
  assert.equal(secondWindow.heat.signal, null);
  assert.doesNotMatch(JSON.stringify(secondWindow), /LAST-LAP PRESSURE/);
});

test("heat-window starts never become crossed memories or future marker spoilers", () => {
  const { window } = full;
  const companion = window.WWAMTapeCompanionEngine.create(neutralInputs());
  const crossing = companion.crossedEvents("race-broadcast-1", 59.5, 60.2);
  const next = companion.getNextMarker("race-broadcast-1", 59);

  assert.equal(crossing.mode, "crossings");
  assert.deepEqual(serial(crossing.events), []);
  assert.equal(crossing.snapshot.currentHeat.heat.score, 94);
  assert.equal(crossing.snapshot.currentHeat.heat.signal, null);
  assert.doesNotMatch(JSON.stringify(crossing), /LAST-LAP PRESSURE/);
  assert.equal(next.at, 75);
  assert.equal(next.reveal, "hidden-until-crossed");
});

test("forward ticks emit only crossed markers while seeks replace the snapshot", () => {
  const { companion } = full;

  const characterTick = companion.crossedEvents(
    "LV2rmwEA0w4",
    9042,
    9043
  );
  assert.equal(characterTick.mode, "crossings");
  assert.equal(characterTick.events.length, 1);
  assert.equal(characterTick.events[0].members.length, 1);
  assert.deepEqual(serial(characterTick.events[0].timestamps), [9042.64]);

  const fullSendTick = companion.crossedEvents(
    "LV2rmwEA0w4",
    9043,
    9046
  );
  assert.equal(fullSendTick.mode, "crossings");
  assert.equal(fullSendTick.events.length, 1);
  assert.equal(fullSendTick.events[0].members.length, 2);
  assert.ok(fullSendTick.events[0].labels.includes("FULL SEND"));

  const forwardSeek = companion.crossedEvents(
    "LV2rmwEA0w4",
    0,
    9043
  );
  assert.equal(forwardSeek.mode, "snapshot");
  assert.equal(forwardSeek.reason, "seek-detected");
  assert.deepEqual(serial(forwardSeek.events), []);
  assert.equal(forwardSeek.snapshot.seconds, 9043);
  assert.ok(forwardSeek.snapshot.activeEvents.length >= 1);

  const reverseSeek = companion.crossedEvents(
    "LV2rmwEA0w4",
    9050,
    9040
  );
  assert.equal(reverseSeek.mode, "snapshot");
  assert.equal(reverseSeek.reason, "reverse-or-stationary");
  assert.deepEqual(serial(reverseSeek.events), []);
  assert.equal(reverseSeek.snapshot.seconds, 9040);

  const stationary = companion.crossedEvents(
    "LV2rmwEA0w4",
    9043,
    9043
  );
  assert.equal(stationary.mode, "snapshot");
  assert.deepEqual(serial(stationary.events), []);
});

test("getNextMarker reveals timing only and handles source boundaries", () => {
  const { companion } = full;
  const next = companion.getNextMarker("LV2rmwEA0w4", 9043);

  assert.deepEqual(serial(next), {
    eventId: "incident:837d5f44",
    at: 9046,
    secondsUntil: 3,
    reveal: "hidden-until-crossed"
  });
  assert.doesNotMatch(JSON.stringify(next), /FULL SEND|Loomis|funding/i);
  assert.equal(companion.getNextMarker("LV2rmwEA0w4", 12785), null);
  assert.equal(companion.getNextMarker("missing-source", 0), null);
  assert.equal(companion.compileTimeline("missing-source"), null);
  assert.equal(companion.snapshotAt("missing-source", 0), null);
  assert.deepEqual(
    serial(companion.crossedEvents("missing-source", 0, 1)),
    { mode: "unknown-source", events: [], snapshot: null }
  );
});

test("Red Band and editorial selections remain distinct annotations", () => {
  const { companion } = full;
  const timeline = companion.compileTimeline("LV2rmwEA0w4");
  const incident = timeline.events.find(
    (event) =>
      event.kind !== "heat-window" &&
      event.timestamps.includes(2270)
  );
  const ranked = incident.annotations.find(
    (annotation) => annotation.type === "ranked-candidate"
  );
  const editorial = incident.annotations.find(
    (annotation) => annotation.type === "editorial-selection"
  );

  assert.ok(ranked);
  assert.equal(ranked.rank, 40);
  assert.equal(ranked.label, "MACHINE-RANKED CANDIDATE");
  assert.equal(ranked.selectionStatus, "machine-ranked");
  assert.match(ranked.semantics, /not an authenticated creator or editor verdict/);

  assert.ok(editorial);
  assert.equal(editorial.displayLabel, "DEMON JIZZ WEATHER REPORT");
  assert.equal(editorial.label, "HUMAN-CURATED EDITORIAL SELECTION");
  assert.equal(editorial.selectionStatus, "human-curated");
  assert.match(editorial.semantics, /distinct from machine rank/);
  assert.match(editorial.semantics, /does not identify a speaker/);
  assert.notEqual(editorial.type, ranked.type);
  assert.equal(incident.evidence.speaker, null);
});

test("every recurring-character annotation keeps owner mapping separate from clip speaker", () => {
  const { companion } = full;
  let count = 0;

  for (const source of companion.listSources()) {
    const timeline = companion.compileTimeline(source.id);
    for (const event of timeline.events) {
      for (const annotation of event.annotations || []) {
        if (annotation.type !== "recurring-character") continue;
        count += 1;
        assert.equal(annotation.ownerMapping.scope, "recurring-character-only");
        assert.equal(annotation.clipSpeaker, null);
        assert.equal(annotation.clipSpeakerStatus, "not-diarized");
        assert.match(annotation.semantics, /does not attribute the voice/);
        assert.equal(event.evidence.speaker, null);
      }
    }
  }

  assert.equal(count, 30);
});

test("every Lore connection is backed by a matched Lore receipt ID", () => {
  const { companion, lore } = full;
  const entryById = new Map(lore.fieldGuide.map((entry) => [entry.id, entry]));
  let count = 0;

  for (const source of companion.listSources()) {
    const timeline = companion.compileTimeline(source.id);
    for (const event of timeline.events) {
      for (const connection of event.loreConnections || []) {
        count += 1;
        const entry = entryById.get(connection.entryId);
        assert.ok(entry, `missing Lore entry ${connection.entryId}`);
        assert.ok(connection.supportReceiptIds.length >= 1);
        for (const receiptId of connection.supportReceiptIds) {
          assert.ok(
            entry.receiptIds.includes(receiptId),
            `${connection.entryId} does not list ${receiptId}`
          );
        }
        assert.deepEqual(
          serial(
            [
              ...connection.supportPerformanceReceiptIds,
              ...connection.supportContextReceiptIds,
              ...connection.supportArchiveReceiptIds
            ].sort()
          ),
          serial(connection.supportReceiptIds.slice().sort())
        );
        assert.deepEqual(
          serial(
            [
              ...connection.relatedPerformanceReceiptIds,
              ...connection.relatedContextReceiptIds,
              ...connection.relatedArchiveReceiptIds
            ].sort()
          ),
          serial(connection.relatedReceiptIds.slice().sort())
        );
        if (/character/i.test(connection.entryKind)) {
          assert.equal(
            connection.chronologyBasis,
            "timestamp-validated-curated-performance-candidates-only"
          );
          if (connection.earliestIndexed) {
            assert.ok(
              entry.performanceReceiptIds.includes(
                connection.earliestIndexed.receiptId
              )
            );
            assert.equal(
              entry.contextReceiptIds.includes(
                connection.earliestIndexed.receiptId
              ),
              false
            );
          }
        }
        assert.equal(connection.trueOriginClaim, false);
        assert.match(connection.semantics, /matched receipt ID/);
      }
    }
  }

  assert.equal(count, companion.metrics.loreConnections);
  assert.ok(count > 0);
});

test("share state round-trips the exact source, second, and safe snapshot", () => {
  const { companion } = full;
  const token = companion.serializeShareState("LV2rmwEA0w4", 9042.64);
  const tokenAgain = companion.serializeShareState("LV2rmwEA0w4", 9042.64);
  const restored = companion.restoreShareState(token);

  assert.equal(token, tokenAgain);
  assert.match(token, /^tc1\.[^.]+\.[0-9a-f]{8}$/);
  assert.equal(restored.ok, true);
  assert.equal(restored.sourceId, "LV2rmwEA0w4");
  assert.equal(restored.seconds, 9042.64);
  assert.equal(restored.archiveFingerprint, companion.archiveFingerprint);
  assert.equal(
    restored.sourceFingerprint,
    companion.compileTimeline("LV2rmwEA0w4").source.fingerprint
  );
  assert.deepEqual(
    restored.snapshot,
    companion.snapshotAt("LV2rmwEA0w4", 9042.64)
  );
  assert.equal(
    companion.restoreShareState(
      companion.serializeShareState("AzrcgoyE7C4", 100)
    ).ok,
    true
  );
  assert.equal(companion.serializeShareState("missing-source", 0), null);
});

test("share restore rejects malformed, tampered, foreign, stale, and out-of-range states", () => {
  const { window, companion, inputs } = full;
  const token = companion.serializeShareState("LV2rmwEA0w4", 9042.64);

  assert.equal(companion.restoreShareState("not-a-share").code, "malformed-share");
  const tampered = token.replace("%22sourceId%22", "%22sourceXd%22");
  assert.equal(companion.restoreShareState(tampered).code, "tampered-share");

  const neutral = window.WWAMTapeCompanionEngine.create(neutralInputs());
  assert.equal(neutral.restoreShareState(token).code, "foreign-channel");

  const stale = window.WWAMTapeCompanionEngine.create(inputs, {
    archiveFingerprint: "later-archive-snapshot"
  });
  assert.equal(stale.restoreShareState(token).code, "stale-archive");

  const payload = decodeToken(token);
  assert.equal(
    companion.restoreShareState(
      encodeToken({ ...payload, sourceFingerprint: "source-v1-deadbeef" })
    ).code,
    "stale-source"
  );
  assert.equal(
    companion.restoreShareState(
      encodeToken({
        ...payload,
        sourceId: "unknown-source",
        sourceFingerprint: "source-v1-unknown"
      })
    ).code,
    "unknown-source"
  );
  assert.equal(
    companion.restoreShareState(
      encodeToken({ ...payload, seconds: 999999 })
    ).code,
    "out-of-range"
  );
  assert.equal(
    companion.restoreShareState(
      encodeToken({ ...payload, schema: "foreign-share/v9" })
    ).code,
    "foreign-schema"
  );
});

test("optional decorations do not invalidate core archive or source share fingerprints", () => {
  const { window, companion, showcase, inputs } = full;
  const lean = window.WWAMTapeCompanionEngine.create({
    showcase,
    deep: inputs.deep,
    live: inputs.live,
    popular: inputs.popular
  });
  const token = companion.serializeShareState("LV2rmwEA0w4", 9043);
  const restored = lean.restoreShareState(token);

  assert.equal(lean.archiveFingerprint, companion.archiveFingerprint);
  assert.equal(
    lean.compileTimeline("LV2rmwEA0w4").source.fingerprint,
    companion.compileTimeline("LV2rmwEA0w4").source.fingerprint
  );
  assert.equal(restored.ok, true);
  assert.equal(restored.sourceId, "LV2rmwEA0w4");
  assert.equal(restored.seconds, 9043);
});

test("same inputs produce byte-stable metrics, timelines, snapshots, and shares", () => {
  const { window, inputs, companion } = full;
  const second = window.WWAMTapeCompanionEngine.create(inputs);

  assert.deepEqual(serial(second.metrics), serial(companion.metrics));
  assert.deepEqual(
    serial(second.compileTimeline("LV2rmwEA0w4")),
    serial(companion.compileTimeline("LV2rmwEA0w4"))
  );
  assert.deepEqual(
    serial(second.snapshotAt("LV2rmwEA0w4", 9043)),
    serial(companion.snapshotAt("LV2rmwEA0w4", 9043))
  );
  assert.equal(
    second.serializeShareState("LV2rmwEA0w4", 9043),
    companion.serializeShareState("LV2rmwEA0w4", 9043)
  );
});

test("a neutral racing adapter compiles with no WWAM or horror vocabulary leakage", () => {
  const { window } = full;
  const companion = window.WWAMTapeCompanionEngine.create(neutralInputs());
  const sources = companion.listSources();
  const timeline = companion.compileTimeline("race-broadcast-1");
  const output = JSON.stringify({
    engine: companion.engine,
    labels: companion.labels,
    metrics: companion.metrics,
    sources,
    timeline,
    snapshot: companion.snapshotAt("race-broadcast-1", 75)
  });

  assert.equal(companion.channelId, "neutral-racing");
  assert.equal(companion.metrics.sources, 1);
  assert.equal(companion.metrics.companionReady, 1);
  assert.equal(timeline.readiness.status, "companion-ready");
  assert.equal(timeline.counts.heatWindows, 2);
  assert.equal(timeline.counts.topicSignals, 1);
  assert.match(output, /BOOTH INTENSITY WINDOW/);
  assert.match(output, /LEAD CHANGE/);
  assert.match(output, /CLOSE FINISH/);
  assert.doesNotMatch(
    output,
    /WWAM|Loomis|Challis|Slenderman|Feldman|Red Band|UP IN YA|horror|franchise felony/i
  );
});

test("generic adapters fuse only compatible receipts within five seconds", () => {
  const { window } = full;
  const inputs = neutralInputs({
    characters: {
      characters: [
        {
          id: "driver-alpha",
          name: "Driver Alpha",
          performedBy: null,
          hostAttribution: {
            status: "not-diarized",
            basis: "The broadcast captions do not identify speakers."
          },
          soundbytes: [
            {
              sourceId: "race-broadcast-1",
              t: 14,
              trigger: "Participant signal"
            }
          ]
        }
      ]
    }
  });
  const companion = window.WWAMTapeCompanionEngine.create(inputs);
  const timeline = companion.compileTimeline("race-broadcast-1");
  const exact = timeline.events.filter((event) => event.kind !== "heat-window");
  const fused = exact.find(
    (event) => event.timestamps.includes(10) && event.timestamps.includes(14)
  );

  assert.ok(fused);
  assert.equal(fused.fused, true);
  assert.deepEqual(serial(fused.timestamps), [10, 14]);
  assert.deepEqual(
    serial(fused.receiptIds),
    ["race-receipt-1", "race-receipt-2"]
  );
  assert.equal(fused.members.length, 2);
  assert.ok(exact.some((event) => event.timestamps.includes(35)));
  assert.ok(exact.some((event) => event.timestamps.includes(75)));
  assert.equal(
    exact.some(
      (event) => event.timestamps.includes(14) && event.timestamps.includes(75)
    ),
    false
  );

  const character = fused.annotations.find(
    (annotation) => annotation.type === "recurring-character"
  );
  assert.ok(character);
  assert.equal(character.clipSpeaker, null);
  assert.equal(character.ownerMapping.recurringPerformer, null);
});

test("generic raw topics and heatmaps become deterministic bounded timeline evidence", () => {
  const { window } = full;
  const companion = window.WWAMTapeCompanionEngine.create(neutralInputs());
  const timeline = companion.compileTimeline("race-broadcast-1");
  const topic = timeline.events.find(
    (event) =>
      event.kind !== "heat-window" &&
      event.members.some((member) => member.kind === "topic-signal")
  );
  const heat = timeline.events.filter((event) => event.kind === "heat-window");

  assert.ok(topic);
  assert.equal(topic.at, 35);
  assert.equal(topic.derived, true);
  assert.equal(
    topic.evidence.basis,
    "timestamped-derived-topic-signal"
  );
  assert.ok(excerptWords(topic.excerpt).length <= 16);
  assert.equal(heat.length, 2);
  assert.deepEqual(
    serial(heat.map((event) => [event.at, event.endAt, event.heat.score])),
    [
      [0, 60, 45],
      [60, 120, 94]
    ]
  );
});

test("the public excerpt limit is enforced before fusion and in every snapshot", () => {
  const { window } = full;
  const longExcerpt = Array.from(
    { length: 40 },
    (_, index) => `word${index + 1}`
  ).join(" ");
  const inputs = neutralInputs({
    receipts: [
      {
        id: "long-receipt",
        sourceId: "race-broadcast-1",
        t: 20,
        category: "LONG RECEIPT",
        excerpt: longExcerpt
      }
    ]
  });
  const companion = window.WWAMTapeCompanionEngine.create(inputs);
  const timeline = companion.compileTimeline("race-broadcast-1");
  const event = timeline.events.find((candidate) =>
    candidate.receiptIds.includes("long-receipt")
  );
  const snapshot = companion.snapshotAt("race-broadcast-1", 20);
  const visible = snapshot.activeEvents.find((candidate) =>
    candidate.receiptIds.includes("long-receipt")
  );

  assert.equal(event.excerptWordCount, 16);
  assert.equal(event.excerptSourceWordCount, 40);
  assert.equal(event.excerptWordLimit, 16);
  assert.equal(event.excerptTruncated, true);
  assert.equal(excerptWords(event.excerpt).length, 16);
  assert.equal(visible.excerptWordCount, 16);
  assert.equal(excerptWords(visible.excerpt).length, 16);
  assert.doesNotMatch(JSON.stringify(timeline), /word17|word40/);
});

test("snapshot seconds clamp safely while forged share seconds fail closed", () => {
  const { companion } = full;
  const source = companion.compileTimeline("LV2rmwEA0w4").source;
  const below = companion.snapshotAt(source.id, -50);
  const above = companion.snapshotAt(source.id, source.durationSeconds + 500);

  assert.equal(below.seconds, 0);
  assert.equal(above.seconds, source.durationSeconds);

  const token = companion.serializeShareState(
    source.id,
    source.durationSeconds + 500
  );
  assert.equal(
    companion.restoreShareState(token).seconds,
    source.durationSeconds
  );
});
