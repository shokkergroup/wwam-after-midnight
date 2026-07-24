import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";
import { runInNewContext } from "node:vm";

async function render(pathname = "/") {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request(`http://localhost${pathname}`, {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );
}

async function loadDemo(files) {
  const root = new URL("../dist/client/demo/", import.meta.url);
  const sandbox = { window: {} };
  for (const file of files) {
    runInNewContext(await readFile(new URL(file, root), "utf8"), sandbox, {
      filename: file,
    });
  }
  return sandbox.window;
}

function plain(value) {
  return JSON.parse(JSON.stringify(value));
}

function tokenCount(value) {
  return String(value || "").trim().split(/\s+/).filter(Boolean).length;
}

function excerptWordCount(value) {
  return tokenCount(
    String(value || "")
      .replace(/^(?:\u2026|â€¦)\s*|\s*(?:\u2026|â€¦)$/g, ""),
  );
}

function assertYouTubeSource(item, expectedId = item.sourceId || item.id) {
  assert.match(expectedId, /^[A-Za-z0-9_-]{11}$/);
  assert.equal(
    item.url,
    `https://www.youtube.com/watch?v=${expectedId}${Number.isFinite(item.t) ? `&t=${Math.round(item.t)}s` : ""}`,
  );
}

function assertBoundedPlayback(soundbyte) {
  assert.ok(Number.isFinite(soundbyte.t) && soundbyte.t >= 0, soundbyte.id);
  assertYouTubeSource(soundbyte);
  assert.equal(soundbyte.playback.provider, "youtube");
  assert.equal(soundbyte.playback.start, soundbyte.t);
  assert.ok(soundbyte.playback.end > soundbyte.playback.start, soundbyte.id);
  assert.equal(
    soundbyte.playback.clipSeconds,
    soundbyte.playback.end - soundbyte.playback.start,
  );
  assert.ok(
    soundbyte.playback.clipSeconds > 0 && soundbyte.playback.clipSeconds <= 14,
    soundbyte.id,
  );
  assert.match(
    soundbyte.playback.embedUrl,
    new RegExp(
      `^https://www\\.youtube\\.com/embed/${soundbyte.sourceId}\\?start=\\d+&end=\\d+&autoplay=1$`,
    ),
  );
  assert.ok(tokenCount(soundbyte.excerpt) <= 16, soundbyte.id);
  assert.ok(soundbyte.confidence >= 0.8 && soundbyte.confidence <= 1, soundbyte.id);
  assert.equal(soundbyte.provenance.timestampStatus, "exact-caption-event");
  assert.match(soundbyte.provenance.channel, /WeWatchedAMovie/);
}

test("root enters the standalone WWAM demo", async () => {
  const response = await render();
  assert.ok([307, 308].includes(response.status));
  assert.equal(new URL(response.headers.get("location")).pathname, "/demo/index.html");
});

test("ships the complete independent WWAM memory-system surface", async () => {
  const root = new URL("../dist/client/demo/", import.meta.url);
  const [
    index,
    app,
    styles,
    deepDistill,
    liveDistill,
    popularDistill,
    curation,
    characterLore,
    channelDna,
    searchEngine,
    showcaseEngine,
  ] = await Promise.all([
    readFile(new URL("index.html", root), "utf8"),
    readFile(new URL("app.js", root), "utf8"),
    readFile(new URL("styles.css", root), "utf8"),
    readFile(new URL("deep-distill.js", root), "utf8"),
    readFile(new URL("livestream-distill.js", root), "utf8"),
    readFile(new URL("popular-live-distill.js", root), "utf8"),
    readFile(new URL("curation.js", root), "utf8"),
    readFile(new URL("character-lore.js", root), "utf8"),
    readFile(new URL("wwam-channel-dna.js", root), "utf8"),
    readFile(new URL("search-engine.js", root), "utf8"),
    readFile(new URL("showcase-engine.js", root), "utf8"),
  ]);

  for (const copy of [
    /WWAM After Midnight/,
    /THE CHANNEL[\s\S]*REMEMBERS ITSELF/,
    /THE RED BAND <em>100<\/em>/,
    /THE TAPE AUTOPSIES/,
    /ASK THE[\s\S]*CHARACTER/,
    /THE POPULAR[\s\S]*TWENTY-FIVE/,
    /THE WWAM[\s\S]*MEMORY OS/,
    /TAKE TIME MACHINE/,
    /BIT ANCESTRY/,
    /RIFF CHEMISTRY/,
    /WWAM COURT/,
    /PERSONALIZED DESCENT/,
    /ASK WWAM \/\/ MULTI-RECEIPT INTELLIGENCE/,
    /WWAM UP IN YA/,
    /THE LIVE[\s\S]*WIRE/,
    /THE CREATOR[\s\S]*CONTROL ROOM/,
    /THE DISTILL<br>HAS RECEIPTS/,
  ]) {
    assert.match(index, copy);
  }
  assert.doesNotMatch(index, /ASK THE COMMENTARY/);

  for (const globalName of [
    "WWAM_CATALOG",
    "WWAM_DEEP_DISTILL",
    "WWAM_LIVESTREAMS",
    "WWAM_POPULAR_LIVE",
    "WWAM_CHARACTER_LORE",
    "WWAM_CHANNEL_DNA",
    "WWAMSearchEngine",
    "WWAMShowcaseEngine",
  ]) {
    assert.match(app, new RegExp(globalName));
  }
  assert.match(app, /OPEN ORIGINAL ON YOUTUBE/);
  assert.match(deepDistill, /wordsAudited/);
  assert.match(deepDistill, /hot100/);
  assert.match(liveDistill, /topicIndex/);
  assert.match(liveDistill, /heatmap/);
  assert.match(popularDistill, /excludedCommentaryCatalog/);
  assert.match(popularDistill, /viewsAtSnapshot/);
  assert.match(curation, /upInYa/);
  assert.match(characterLore, /GENERATED CHARACTER RIFF/);
  assert.match(characterLore, /candidate-needs-human-verification/);
  assert.match(channelDna, /qualityGates/);
  assert.match(searchEngine, /evidenceChain/);
  assert.match(searchEngine, /contextualEntity/);
  assert.match(showcaseEngine, /buildDescent/);
  assert.match(showcaseEngine, /getControlRoom/);
  assert.match(styles, /--acid:\s*#d8ff38/);

  const combined = [
    index,
    app,
    styles,
    deepDistill,
    liveDistill,
    popularDistill,
    curation,
    characterLore,
    channelDna,
    searchEngine,
    showcaseEngine,
  ].join("\n");
  assert.doesNotMatch(combined, /Vigilante|VRL|racing site|SHOKKER LORE/i);
  assert.doesNotMatch(index, /\.\.\/\.\.\//);

  await Promise.all([
    "catalog.js",
    "deep-distill.js",
    "livestream-distill.js",
    "popular-live-distill.js",
    "curation.js",
    "character-lore.js",
    "wwam-channel-dna.js",
    "search-engine.js",
    "showcase-engine.js",
    "app.js",
    "styles.css",
  ].map((file) => access(new URL(file, root))));
  await access(new URL("../og.png", root));
});

test("newest livestreams are mapped, current, and copyright-bounded", async () => {
  const window = await loadDemo(["livestream-distill.js"]);
  const live = plain(window.WWAM_LIVESTREAMS);

  assert.equal(live.streams.length, 10);
  assert.equal(live.streams[0].id, "LV2rmwEA0w4");
  assert.equal(live.streams[0].date, "2026-07-23");
  assert.equal(live.meta.captioned, 9);
  assert.ok(live.meta.wordsAudited > 350_000);
  assert.ok(live.meta.hours >= 34);
  assert.ok(live.meta.moments >= 60);
  assert.ok(live.meta.topics >= 20);
  assert.equal(live.streams.filter((stream) => stream.captioned).length, 9);
  assert.ok(
    live.streams.filter((stream) => stream.captioned)
      .every((stream) => stream.heatmap.length === 30 && stream.topics.length > 0),
  );
  assert.ok(
    live.streams.flatMap((stream) => stream.moments)
      .every((moment) => excerptWordCount(moment.quote) <= 16),
  );
  assert.ok(
    live.streams.flatMap((stream) => stream.topics)
      .every((topic) => excerptWordCount(topic.receipt) <= 11),
  );
});

test("Popular 25 contains exactly 25 new, ranked, source-grounded livestreams", async () => {
  const window = await loadDemo([
    "catalog.js",
    "livestream-distill.js",
    "popular-live-distill.js",
  ]);
  const catalog = plain(window.WWAM_CATALOG);
  const live = plain(window.WWAM_LIVESTREAMS);
  const popular = plain(window.WWAM_POPULAR_LIVE);
  const catalogIds = new Set(catalog.map((item) => item.id));
  const freshIds = new Set(live.streams.map((stream) => stream.id));
  const popularIds = popular.streams.map((stream) => stream.id);

  assert.equal(popular.streams.length, 25);
  assert.equal(new Set(popularIds).size, 25);
  assert.equal(popularIds[0], "jG93HvyP420");
  assert.equal(popularIds.at(-1), "RIWVY41ny7w");
  assert.deepEqual(popular.streams.map((stream) => stream.rank), [...Array(25)].map((_, i) => i + 1));
  assert.ok(popular.streams.every((stream, index) => (
    index === 0 || popular.streams[index - 1].views >= stream.views
  )));
  assert.deepEqual(popularIds.filter((id) => catalogIds.has(id)), []);
  assert.deepEqual(popularIds.filter((id) => freshIds.has(id)), []);
  assert.deepEqual(
    [...new Set(popular.selection.excludedFresh10)].sort(),
    [...freshIds].sort(),
  );
  assert.deepEqual(
    [...new Set(popular.selection.excludedCommentaryCatalog)].sort(),
    [...catalogIds].sort(),
  );
  assert.deepEqual(popular.selection.metadataUnavailable, []);
  assert.equal(popular.selection.officialFeedEntries, 472);
  assert.equal(popular.selection.ranking, "YouTube view_count descending");

  const captioned = popular.streams.filter((stream) => stream.captioned);
  const uncaptioned = popular.streams.filter((stream) => !stream.captioned);
  assert.equal(captioned.length, 24);
  assert.equal(uncaptioned.length, 1);
  assert.equal(uncaptioned[0].id, "cQAVmNFQmoI");
  assert.equal(popular.meta.streams, 25);
  assert.equal(popular.meta.captioned, 24);
  assert.equal(popular.meta.uncaptioned, 1);
  assert.equal(popular.meta.hours, 78);
  assert.equal(popular.meta.wordsAudited, 927_620);
  assert.equal(popular.meta.viewsAtSnapshot, 1_467_586);
  assert.equal(popular.meta.topicLanes, 240);
  assert.equal(popular.meta.distinctTopics, 42);
  assert.equal(popular.meta.moments, 168);
  assert.equal(popular.meta.characterSignals, 51);
  assert.equal(popular.meta.explicitPerformanceCues, 72);
  assert.equal(
    popular.meta.wordsAudited,
    popular.streams.reduce((sum, stream) => sum + stream.wordsAudited, 0),
  );
  assert.equal(
    popular.meta.viewsAtSnapshot,
    popular.streams.reduce((sum, stream) => sum + stream.views, 0),
  );
  assert.equal(
    popular.meta.characterSignals,
    popular.streams.reduce((sum, stream) => sum + stream.characters.length, 0),
  );
  assert.equal(
    popular.meta.explicitPerformanceCues,
    popular.streams.flatMap((stream) => stream.characters)
      .reduce((sum, signal) => sum + signal.performanceCues, 0),
  );

  for (const stream of popular.streams) {
    assertYouTubeSource(stream, stream.id);
    assert.equal(stream.thumbnail, `https://i.ytimg.com/vi/${stream.id}/maxresdefault.jpg`);
    assert.ok(Number.isInteger(stream.views) && stream.views > 0, stream.id);
    assert.ok(Number.isInteger(stream.duration) && stream.duration > 0, stream.id);
    assert.ok(stream.editorial.whyItMatters.includes(stream.views.toLocaleString("en-US")), stream.id);

    if (!stream.captioned) {
      assert.equal(stream.wordsAudited, 0);
      assert.deepEqual(stream.topics, []);
      assert.deepEqual(stream.moments, []);
      assert.deepEqual(stream.characters, []);
      assert.deepEqual(stream.heatmap, []);
      assert.equal(stream.peak, null);
      assert.ok(Object.values(stream.indices).every((value) => value === null));
      assert.match(stream.editorial.whyItMatters, /no usable English caption track/i);
      continue;
    }

    assert.equal(stream.topics.length, 10, stream.id);
    assert.equal(stream.moments.length, 7, stream.id);
    assert.equal(stream.heatmap.length, 30, stream.id);
    assert.ok(stream.wordsAudited > 0, stream.id);
    assert.ok(Object.values(stream.indices).every((value) => value >= 38 && value <= 99), stream.id);
    assert.equal(stream.heatmap[0].from, 0);
    assert.ok(Math.abs(stream.heatmap.at(-1).to - stream.duration) <= 2, stream.id);
    assert.deepEqual(stream.peak, stream.heatmap.reduce((best, bin) => (
      bin.heat > best.heat ? bin : best
    )));

    stream.heatmap.forEach((bin, index) => {
      assert.ok(bin.from >= 0 && bin.to > bin.from, stream.id);
      assert.ok(bin.heat >= 0 && bin.heat <= 100, stream.id);
      if (index) assert.equal(bin.from, stream.heatmap[index - 1].to, stream.id);
    });
    stream.topics.forEach((topic) => {
      assert.ok(topic.first >= 0 && topic.first <= stream.duration, stream.id);
      assert.ok(topic.peak >= 0 && topic.peak <= stream.duration, stream.id);
      assert.ok(topic.mentions > 0 && topic.cluster > 0, stream.id);
      assert.ok(tokenCount(topic.receipt) <= 8, stream.id);
    });
    stream.moments.forEach((moment) => {
      assert.ok(moment.t >= 0 && moment.t <= stream.duration, stream.id);
      assert.ok(moment.heat >= 0 && moment.heat <= 100, stream.id);
      assert.ok(tokenCount(moment.quote) <= 13, stream.id);
    });
    stream.characters.forEach((signal) => {
      assert.ok(signal.t >= 0 && signal.t <= stream.duration, stream.id);
      assert.ok(signal.mentions > 0 && signal.performanceCues >= 0, stream.id);
      assert.ok(tokenCount(signal.receipt) <= 10, stream.id);
    });
  }
});

test("Character Lore enables four grounded voices and locks unverifiable attribution", async () => {
  const window = await loadDemo(["character-lore.js"]);
  const lore = plain(window.WWAM_CHARACTER_LORE);
  const expectedPerformers = {
    loomis: "J",
    challis: "Mike",
    slenderman: "J",
    "corey-feldman": "J",
  };
  const expectedByteCounts = {
    loomis: 7,
    challis: 7,
    slenderman: 6,
    "corey-feldman": 5,
  };

  assert.equal(lore.characters.length, 4);
  assert.equal(lore.characters.reduce((sum, character) => sum + character.soundbytes.length, 0), 25);
  assert.equal(lore.guardrails.generatedRiffLabelRequired, true);
  assert.equal(
    lore.guardrails.requiredLabel,
    "GENERATED CHARACTER RIFF — NOT A REAL WWAM QUOTE",
  );
  assert.equal(lore.guardrails.voiceCloning, "disabled");
  assert.equal(lore.guardrails.fabricatedQuotes, "forbidden");
  assert.equal(lore.guardrails.speakerGuessing, "forbidden");
  assert.equal(lore.guardrails.realPersonAllegations, "forbidden");
  assert.match(lore.guardrails.archiveAudioPolicy, /linked source at the validated timestamp/);
  assert.match(lore.guardrails.archiveAudioPolicy, /Generated responses remain text-only/);

  for (const character of lore.characters) {
    assert.equal(character.status, "grounded");
    assert.equal(character.askEnabled, true);
    assert.equal(character.performedBy, expectedPerformers[character.id]);
    assert.equal(character.hostAttribution.status, "user-supplied");
    assert.equal(character.hostAttribution.confidence, 1);
    assert.equal(character.soundbytes.length, expectedByteCounts[character.id]);
    assert.equal(
      character.metrics.curatedPerformanceCandidates,
      expectedByteCounts[character.id],
    );
    assert.equal(character.responseKit.enabled, true);
    assert.equal(character.responseKit.mode, "grounded-text-riff");
    assert.equal(character.responseKit.label, lore.guardrails.requiredLabel);
    assert.ok(character.responseKit.templates.length >= 3);
    assert.ok(character.behaviorPatterns.length >= 3);
    assert.ok(character.triggerSignals.length >= 4);
    character.soundbytes.forEach(assertBoundedPlayback);
  }
  assert.match(
    lore.characters.find((character) => character.id === "corey-feldman")
      .responseKit.additionalGuardrail,
    /Do not generate new allegations about any real person/,
  );

  assert.equal(lore.lockedCandidates.length, 1);
  const locked = lore.lockedCandidates[0];
  assert.equal(locked.id, "marky-mark");
  assert.equal(locked.status, "candidate-needs-human-verification");
  assert.equal(locked.performedBy, null);
  assert.equal(locked.askEnabled, false);
  assert.equal(locked.hostAttribution.status, "not-diarized");
  assert.equal(locked.soundbytes.length, 3);
  assert.equal(locked.metrics.lockedPerformanceCandidates, 3);
  assert.match(locked.whyLocked, /performer identity has not been supplied/i);
  locked.soundbytes.forEach(assertBoundedPlayback);
});

test("Ask understands evidence chains, Popular 25, follow-ups, recency, and uncertainty", async () => {
  const window = await loadDemo([
    "catalog.js",
    "deep-distill.js",
    "livestream-distill.js",
    "popular-live-distill.js",
    "curation.js",
    "search-engine.js",
  ]);
  const engine = window.WWAMSearchEngine.create(
    window.WWAM_CATALOG,
    window.WWAM_DEEP_DISTILL,
    window.WWAM_LIVESTREAMS,
    window.WWAM_CURATED,
    window.WWAM_POPULAR_LIVE,
  );

  const remake = plain(engine.ask("What do they hate about the Elm Street remake?"));
  assert.equal(remake.results[0].sourceId, "qTQdWKcwn4A");
  assert.equal(remake.results[0].category, "FRANCHISE FELONY");
  assert.ok(remake.evidenceChain.length >= 2);
  assert.deepEqual(
    remake.evidenceChain.slice(0, 2).map((receipt) => receipt.role),
    ["PRIMARY RECEIPT", "SUPPORTING RECEIPT"],
  );
  remake.evidenceChain.forEach((receipt) => {
    assert.ok(receipt.result.sourceId);
    assert.ok(Number.isFinite(receipt.result.at));
    assert.match(receipt.result.url, /^https:\/\/www\.youtube\.com\/watch\?v=/);
  });

  const latestHalloween = plain(
    engine.ask("What did they say about Halloween on the latest livestream?"),
  );
  assert.equal(latestHalloween.entity, "Halloween");
  assert.equal(latestHalloween.source, "livestream");
  assert.equal(latestHalloween.results[0].sourceId, "LV2rmwEA0w4");
  assert.equal(latestHalloween.results[0].kind, "topic");
  assert.equal(latestHalloween.results[0].lane, "fresh");

  const popularFollowup = plain(
    engine.ask("What about the most popular ones?", latestHalloween),
  );
  assert.equal(popularFollowup.continuedFrom, true);
  assert.equal(popularFollowup.entity, "Halloween");
  assert.equal(popularFollowup.popularity, "popular");
  assert.equal(popularFollowup.results[0].sourceId, "jG93HvyP420");
  assert.equal(popularFollowup.results[0].lane, "popular");
  assert.equal(popularFollowup.results[0].views, 203_603);
  assert.match(popularFollowup.results[0].reasons.join(" "), /foundational popularity/);

  const popularHalloween = plain(
    engine.ask("What was their most popular Halloween livestream?"),
  );
  assert.equal(popularHalloween.entity, "Halloween");
  assert.equal(popularHalloween.source, "livestream");
  assert.equal(popularHalloween.popularity, "popular");
  assert.equal(popularHalloween.results[0].sourceId, "jG93HvyP420");
  assert.equal(popularHalloween.results[0].lane, "popular");
  assert.equal(popularHalloween.results[0].views, 203_603);
  assert.match(popularHalloween.answer, /203,603 official views/);

  const batman = plain(engine.ask("Where did they talk about Batman recently?"));
  assert.equal(batman.entity, "Batman");
  assert.equal(batman.results[0].source, "livestream");

  const newestFunny = plain(engine.ask("What is funniest in the newest stream?"));
  assert.equal(newestFunny.results[0].sourceId, "LV2rmwEA0w4");
  assert.match(newestFunny.results[0].reasons.join(" "), /newest stream/);

  const speaker = plain(engine.ask("Who hated Scream 3?"));
  assert.match(speaker.answer, /won't invent a name/);

  const deranged = plain(engine.ask("Show me the most deranged thing they said"));
  assert.equal(deranged.status, "surface-handoff");
  assert.deepEqual(deranged.results, []);
  assert.equal(deranged.recommendedSurface.href, "#red100");
});

test("Showcase Engine unifies all 74 non-overlapping sources into playable memory", async () => {
  const window = await loadDemo([
    "catalog.js",
    "deep-distill.js",
    "livestream-distill.js",
    "popular-live-distill.js",
    "character-lore.js",
    "wwam-channel-dna.js",
    "showcase-engine.js",
  ]);
  const showcase = window.WWAMShowcaseEngine.create({
    catalog: window.WWAM_CATALOG,
    deep: window.WWAM_DEEP_DISTILL,
    live: window.WWAM_LIVESTREAMS,
    popular: window.WWAM_POPULAR_LIVE,
    characters: window.WWAM_CHARACTER_LORE,
    dna: window.WWAM_CHANNEL_DNA,
  });
  const metrics = plain(showcase.metrics);
  const sourceIds = showcase.sources.map((source) => source.id);

  assert.equal(metrics.sources, 74);
  assert.equal(new Set(sourceIds).size, 74);
  assert.equal(metrics.commentaries, 39);
  assert.equal(metrics.livestreams, 35);
  assert.equal(metrics.popularLivestreams, 25);
  assert.equal(metrics.wordsAudited, 1_880_873);
  assert.ok(metrics.receipts > 850);
  assert.ok(metrics.graphNodes > 150);
  assert.ok(metrics.graphEdges > 550);
  assert.ok(metrics.timeMachines > 40);
  assert.equal(metrics.bitLineages, 4);
  assert.ok(metrics.riffMoments > 250);
  assert.ok(metrics.courtCases >= 10);
  assert.equal(metrics.aftermathReports, 35);

  plain(showcase.characterReadiness).forEach((character) => {
    assert.equal(character.performerStatus, "owner-confirmed");
    assert.equal(character.readyForAskCharacter, true);
    assert.ok(character.curatedCandidateReceiptIds.length >= 5);
    assert.equal(character.authenticatedEditorVerifiedReceiptIds.length, 0);
    assert.match(character.disclosure, /not a real quote/i);
  });
  plain(showcase.getBitLineages()).forEach((lineage) => {
    assert.ok(lineage.events.length >= 5);
    lineage.events.forEach((event) => {
      assert.ok(event.sourceId);
      assert.ok(Number.isFinite(event.t));
      assert.match(event.url, /^https:\/\/www\.youtube\.com\/watch\?v=/);
    });
  });
  const timeMachine = plain(showcase.getTimeMachines()[0]);
  assert.ok(timeMachine.events.length >= 2);
  assert.ok(timeMachine.events.every((event) => Number.isFinite(event.t)));
  const descent = plain(showcase.buildDescent({ mode: "LORE", minutes: 20 }));
  assert.ok(descent.path.length > 0);
  assert.ok(descent.path.every((stop) => (
    stop.sourceId && Number.isFinite(stop.t) &&
    /^https:\/\/www\.youtube\.com\/watch\?v=/.test(stop.url)
  )));
  const control = plain(showcase.getControlRoom());
  assert.ok(control.approvals.length > 0);
  assert.ok(control.opportunities.length > 0);
  assert.ok(control.resurfaced.length > 0);
});

test("catalog preserves all four bounded franchise paths", async () => {
  const window = await loadDemo(["catalog.js"]);
  const catalog = plain(window.WWAM_CATALOG);

  assert.equal(catalog.length, 39);
  assert.equal(catalog.filter((item) => item.franchise === "Halloween").length, 13);
  assert.equal(catalog.filter((item) => item.franchise === "Friday the 13th").length, 12);
  assert.equal(catalog.filter((item) => item.franchise === "Scream").length, 6);
  assert.equal(catalog.filter((item) => item.franchise === "A Nightmare on Elm Street").length, 8);
  assert.equal(catalog.filter((item) => item.transcript).length, 38);
  assert.ok(catalog.every((item) => /^https:\/\/www\.youtube\.com\/watch\?v=/.test(item.url)));
});

test("deep distill is evidence-rich and copyright-bounded", async () => {
  const window = await loadDemo(["deep-distill.js"]);
  const deep = plain(window.WWAM_DEEP_DISTILL);

  assert.equal(deep.meta.tapes, 39);
  assert.equal(deep.meta.captioned, 38);
  assert.equal(deep.meta.franchises, 4);
  assert.equal(deep.hot100.length, 100);
  assert.ok(deep.meta.wordsAudited > 500_000);
  assert.ok(deep.meta.captionHours >= 60);
  assert.equal(deep.tapes.length, 39);
  assert.ok(deep.tapes.every((tape) => tape.moments.length <= 8));
  assert.ok(
    deep.tapes.flatMap((tape) => tape.moments)
      .every((moment) => excerptWordCount(moment.quote) <= 22),
  );
  assert.ok(deep.hot100.every((moment, index) => moment.rank === index + 1));
});

test("contains no starter-preview residue", async () => {
  const [page, layout, packageJson] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../package.json", import.meta.url), "utf8"),
  ]);

  assert.doesNotMatch(page, /SkeletonPreview|codex-preview/);
  assert.doesNotMatch(layout, /Starter Project|codex-preview/);
  assert.doesNotMatch(packageJson, /react-loading-skeleton/);
  assert.equal(JSON.parse(packageJson).name, "wwam-after-midnight-demo");
});
