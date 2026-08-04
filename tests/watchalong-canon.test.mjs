import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const demo = path.join(root, "public", "demo");
const html = fs.readFileSync(path.join(demo, "index.html"), "utf8");
const ui = fs.readFileSync(path.join(demo, "watchalong-canon-ui.js"), "utf8");
const css = fs.readFileSync(path.join(demo, "watchalong-canon.css"), "utf8");
const app = fs.readFileSync(path.join(demo, "app.js"), "utf8");
const dossierCss = fs.readFileSync(path.join(demo, "source-dossier.css"), "utf8");
const halloweenUi = fs.readFileSync(path.join(demo, "halloween-universe-ui.js"), "utf8");
const livestreamAnchors = fs.readFileSync(path.join(demo, "livestream-audio-anchors.js"), "utf8");
const livestreamAnchorsCss = fs.readFileSync(path.join(demo, "livestream-audio-anchors.css"), "utf8");
const context = { console };
context.window = context;
vm.createContext(context);
vm.runInContext(fs.readFileSync(path.join(demo, "wwam-watchalong-canon.js"), "utf8"), context);
vm.runInContext(fs.readFileSync(path.join(demo, "wwam-watchalong-route-index.js"), "utf8"), context);
vm.runInContext(fs.readFileSync(path.join(demo, "wwam-watch-pass-pilot.js"), "utf8"), context);
vm.runInContext(fs.readFileSync(path.join(demo, "wwam-podcast-commentary-audio.js"), "utf8"), context);
const canon = context.WWAM_WATCHALONG_CANON;
const routeIndex = context.WWAM_WATCHALONG_ROUTE_INDEX;
const watchPass = context.WWAM_WATCH_PASS_PILOT;
const podcastAudio = context.WWAM_PODCAST_COMMENTARY_AUDIO;

test("primary navigation exposes the signature comedy lanes", () => {
  assert.match(html, /class="nav-signature nav-steve"[^>]+href="#steves-asshole"/);
  assert.match(html, /class="nav-signature nav-upinya"[^>]+href="#upinya"/);
  assert.match(html, />STEVE'S ASSHOLE<\/a>/);
  assert.match(html, />UP IN YA<\/a>/);
});

test("per-show dossiers expose a guided read/listen/evidence path", () => {
  assert.match(ui, /function dossierJumpMarkup\(\)/);
  assert.match(ui, /href="#wacDossierRoutes">THE READ/);
  assert.match(ui, /href="#wacDossierListen">LISTENING LANES/);
  assert.match(ui, /href="#wacDossierEvidence">FULL RECEIPTS/);
  assert.match(ui, /id="wacDossierRoutes"/);
  assert.match(ui, /id="wacDossierListen"/);
  assert.match(ui, /id="wacDossierEvidence"/);
  assert.match(ui, /item\.body \? excerpt\(item\.body, 210\) : receiptExcerpt\(item\.excerpt, 210\)/);
  assert.match(css, /\.wac-dossier-jump/);
  assert.match(ui, /state\.franchise = franchises\.filter\(function \(item\) \{ return item\.key === "comedy"; \}\)/);
});

test("Halloween Universe quarantines rough caption windows instead of printing decoder soup", () => {
  const halloweenContext = { console };
  halloweenContext.window = halloweenContext;
  vm.createContext(halloweenContext);
  vm.runInContext(halloweenUi, halloweenContext);
  const model = {
    query: "",
    activeTab: "films",
    selectedFilm: {
      id: "12345678901",
      order: 1,
      film: "Halloween Test Tape",
      thumbnail: "https://example.test/thumb.jpg",
      access: "captured",
      duration: 120,
      wordsAudited: 120,
      captionEvents: 4,
      topicDoors: [],
      characterReferences: [],
      variants: [],
      moments: [{ sourceId: "12345678901", start: 10, end: 20, label: "UP IN YA", excerpt: "it is is the it before this before that" }]
    },
    films: [],
    paths: [],
    activePath: null,
    searchResults: [],
    loomis: [],
    challis: [],
    upInYa: [],
    steve: [],
    canon: [],
    evidenceLegend: [],
    summary: { films: 1, auditedWords: 120, topicDoors: 0, characterCallbacks: 0, alternateTreatments: 0, canonSources: 1 }
  };
  const rendered = halloweenContext.WWAMHalloweenUniverseUI.renderMarkup(model);
  assert.doesNotMatch(rendered, /it is is the it before this before that/);
  assert.match(rendered, /auto-caption window was too rough to print as a quote/);
});

test("cold-route Show Wiki index mirrors every source and keeps full dossier cuts", () => {
  assert.equal(routeIndex.schema, "shokker-wwam-watchalong-route-index/v1");
  assert.equal(routeIndex.sources.length, 131, "edge sources replace their thinner companion shells without duplicating cold routes");
  const edgeLonglegs = routeIndex.sources.find((source) => source.id === "7efMRH1jr9M");
  assert.ok(edgeLonglegs?.edgeAdjacent, "caption-confirmed adjacent sources receive their own cold-route room");
  assert.equal(edgeLonglegs.formatBoundary, "ADJACENT PUBLIC SOURCE // NOT A FULL-FILM COMMENTARY");
  assert.ok(edgeLonglegs.dossier.cuts.length >= 9);
  const halloweenFour = routeIndex.sources.find((source) => source.id === "28PfRNKoSCA");
  assert.ok(halloweenFour);
  assert.ok(halloweenFour.dossier.cuts.length >= 37, "deep dossiers can grow when source-local lane supplements uncover additional playable receipts");
  assert.ok(halloweenFour.dossier.cuts.some((cut) => cut.category === "STRAIGHT TO STEVE'S ASSHOLE"));
  const deepWatchalongs = canon.episodes.filter((episode) => episode.deepIndexed && Number(episode.dossier?.caption?.events || 0) > 0);
  assert.equal(deepWatchalongs.length, 38);
  assert.ok(deepWatchalongs.every((episode) => episode.dossier.cuts.some((cut) => cut.category === "UP IN YA")), "deep watchalongs retain explicit vulgarity doors");
  assert.ok(deepWatchalongs.every((episode) => episode.dossier.cuts.some((cut) => cut.category === "CHARACTER SIGNAL")), "deep watchalongs retain character doors");
  const heldH2 = routeIndex.sources.find((source) => source.id === "AzrcgoyE7C4");
  assert.ok(heldH2?.alternateAudio, "held H2 keeps its official podcast edition on the cold route");
  assert.equal(heldH2.alternateAudio.candidateCount, 43);
  assert.equal(heldH2.alternateAudio.timestampIsomorphic, false);
  assert.equal(heldH2.alternateAudio.routes.length, 43);
  assert.match(heldH2.alternateAudio.enclosureUrl, /^https:\/\/traffic\.megaphone\.fm\//);
  assert.ok(heldH2.alternateAudio.routes.every((route) => route.clock === "official WWAM podcast clock"));
  assert.equal(heldH2.alternateAudio.routes[0].category, "PODCAST AD / INTRO");
  assert.equal(heldH2.alternateAudio.routes[0].segmentKind, "podcast-ad-or-intro");
  assert.match(heldH2.alternateAudio.routes[0].reviewStatus, /do not cite as a WWAM bit/i);
  assert.ok(heldH2.dossier.cuts.every((cut) => cut.sourceKind === "podcast-variant" || cut.sourceKind == null));
});

test("watchalong canon has the complete public source registry", () => {
  assert.equal(canon.schema, "shokker-wwam-watchalong-canon/v1");
  assert.match(canon.sourcePolicy, /non-isomorphic/i);
  assert.equal(canon.podcastAudit.feedItemsAudited, 56);
  assert.equal(canon.podcastAudit.titleExplicitFilmCommentaries, 56);
  assert.equal(canon.podcastAudit.newToPublicYouTubeCanon, 6);
  assert.equal(canon.podcastFeedRecords.length, 56);
  assert.match(canon.podcastAudit.feedUrl, /anchor\.fm\/s\/10a245f8\/podcast\/rss/);
  assert.equal(canon.stats.episodes, 103);
  assert.equal(canon.stats.movieGroups, 92);
  assert.equal(canon.stats.franchises, 14);
  assert.equal(canon.stats.deepDossiers, 38);
  assert.equal(canon.stats.captionLedgers, 64);
  assert.equal(canon.stats.sourceBriefs, 1);
  assert.equal(canon.stats.nonFullAdditions, 65);
  assert.equal(canon.stats.podcastOnlyCommentaries, 6);
  assert.equal(canon.stats.podcastFeedRecords, 56);
  assert.equal(canon.stats.uniqueFilmSources, 109);
  assert.equal(canon.stats.companionWatchalongs, 11);
  assert.equal(canon.stats.companionReviews, 17);
  assert.equal(canon.stats.edgeAdjacentSources, 25);
  assert.equal(canon.stats.edgeCaptionConfirmed, 5);
  assert.equal(canon.edgeAdjacentSources.length, 25);
  assert.equal(canon.edgeAdjacentSources.filter((source) => source.dossier.caption.events > 0).length, 5);
  assert.equal(canon.companionWatchalongs.length, 11);
  assert.equal(canon.companionReviews.length, 17);
  assert.ok(canon.companionWatchalongs.some((record) => /DUNKIRK/i.test(record.title)));
  assert.ok(canon.companionWatchalongs.some((record) => /Star Trek/i.test(record.title)));
  assert.ok(canon.companionReviews.some((record) => /LONGLEGS/i.test(record.title)));
  const earlyCut = canon.companionWatchalongs.find((record) => record.id === "a4uOCsmPKD4");
  assert.equal(earlyCut.dossier.state, "companion-source-brief");
  assert.equal(earlyCut.formatBoundary, "EARLY EDITED WATCHALONG // NOT A FULL-FILM COMMENTARY");
  const adjacentReview = canon.companionReviews.find((record) => record.id === "jfirLE0reBY");
  assert.equal(adjacentReview.dossier.state, "companion-source-brief");
  assert.equal(adjacentReview.formatBoundary, "ADJACENT REACTION / REVIEW // NOT A FULL-FILM COMMENTARY");
  const captionedReview = canon.companionReviews.find((record) => record.id === "7efMRH1jr9M");
  assert.equal(captionedReview.dossier.state, "companion-caption-dossier");
  assert.ok(captionedReview.dossier.cuts.length >= 9);
  assert.equal(captionedReview.dossier.caption.sourceFile, "source-cache/captions/edge-7efMRH1jr9M.en.json3");
  const earlyRoute = routeIndex.sources.find((source) => source.id === "a4uOCsmPKD4");
  assert.equal(earlyRoute.dossier.state, "adjacent-source-brief", "edge audit receipts supersede the thinner companion shell on cold routes");
  assert.equal(earlyRoute.formatBoundary, "ADJACENT PUBLIC SOURCE // NOT A FULL-FILM COMMENTARY");
  assert.equal(canon.podcastCommentaries.length, 6);
  assert.ok(canon.podcastCommentaries.some((record) => record.movieTitle === "Wayne's World"));
  assert.ok(canon.podcastCommentaries.some((record) => record.movieTitle === "Predator (1987)"));
  assert.ok(canon.podcastCommentaries.every((record) => record.status === "recovered-audio-lead" && record.evidence.publicPlayback === true));
  assert.equal(Object.keys(podcastAudio.records).length, 6);
  assert.ok(Object.values(podcastAudio.records).every((record) => record.status === "podcast-audio-feature" && record.candidates.length >= 20));
  assert.ok(Object.values(podcastAudio.records).every((record) => record.media.canonicalTimestampMapping === false));
  assert.ok(Object.values(podcastAudio.records).every((record) => record.dossier && record.dossier.chapters.length >= 3));
  assert.ok(Object.values(podcastAudio.records).some((record) => record.dossier.topics.length > 0));
  assert.equal(canon.stats.sourceCounts.heldMembersOnly, 22);
  assert.equal(canon.stats.sourceCounts.liveStrictCandidates, 112);
  assert.equal(canon.stats.sourceCounts.liveStrictPublicCandidates, 90);
  assert.equal(canon.stats.sourceCounts.legacyCatalogRetained, 13);
  assert.equal(canon.scope.channelSnapshotSources, 2882);
  assert.equal(canon.discovery.explicitCandidateCount, 112);
  assert.equal(canon.discovery.liveStrictCandidateCount, 112);
  assert.equal(canon.discovery.liveStrictPublicCandidateCount, 90);
  assert.equal(canon.discovery.liveStrictHeldCandidateCount, 22);
  assert.equal(canon.discovery.legacyCatalogRetained.length, 13);
  assert.equal(canon.discovery.broadCandidateCount, 139);
  assert.equal(canon.discovery.broadSignalCounts["watchalong-or-commentary"], 102);
  assert.equal(canon.discovery.broadSignalCounts["watchalong-edit"], 20);
  assert.equal(canon.discovery.broadDiscoveryOmissions.length, 49);
  assert.equal(canon.discovery.broadDiscoveryOmissions.filter((record) => record.availability === "subscriber_only").length, 24);
  assert.equal(canon.coverageLedger.publicYoutubeCanon, 103);
  assert.equal(canon.coverageLedger.podcastFeedRecords, 56);
  assert.equal(canon.coverageLedger.podcastFeedOverlaps, 50);
  assert.equal(canon.coverageLedger.uniqueFilmSources, 109);
  assert.equal(canon.discovery.edgeReview.publicEdgeLeads, 25);
  assert.equal(canon.discovery.edgeReview.captionConfirmed, 5);
  assert.equal(canon.coverageLedger.podcastRecoveries, 6);
  assert.equal(canon.coverageLedger.heldStrictMembersOnly, 22);
  assert.equal(canon.coverageLedger.adjacentPublicLeads, 25);
  assert.equal(canon.coverageLedger.unresolvedEdgeLeads, 0);
  assert.equal(canon.coverageLedger.companionWatchalongs, 11);
  assert.equal(canon.coverageLedger.companionReviews, 17);
  assert.equal(canon.coverageLedger.companionPublic, 25);
  assert.equal(canon.coverageLedger.companionHeld, 3);
  assert.ok(canon.coverageLedger.crossGenreExamples.some((record) => /Rambo/i.test(record.title)));
  assert.ok(canon.coverageLedger.crossGenreExamples.some((record) => /Wayne's World/i.test(record.title)));
  assert.ok(canon.discovery.broadDiscoveryOmissions.some((record) => /Watching GHOSTBUSTERS/i.test(record.title)));
  assert.equal(canon.discovery.heldTitleCandidates.length, 22);
  assert.match(canon.discovery.watchedMoviePattern, /we\\s\+watched/i);
  assert.match(canon.discovery.letWatchMoviePattern, /let/i);
  assert.equal(canon.episodes.find((episode) => episode.id === "9Kql8Y14bAw")?.movieTitle, "Sinister (2012)");
  assert.equal(canon.episodes.find((episode) => episode.id === "0X8Jq7wxfJo")?.movieTitle, "The Batman (2022)");
  assert.equal(canon.episodes.find((episode) => episode.id === "ot91NhcRSdM")?.movieTitle, "Child's Play (1988)");
  assert.equal(canon.episodes.find((episode) => episode.id === "BqIiHSqSM_U")?.movieTitle, "Candyman (1992)");
  assert.equal(canon.episodes.find((episode) => episode.id === "NZprZ1gWBIw")?.movieTitle, "Halloween (2018)");
  assert.ok(canon.discovery.titleCandidates.some((record) => /Rambo|Saved By The Bell|Batman|Terminator|Men In Black/i.test(record.title)));
  assert.equal(new Set(canon.episodes.map((episode) => episode.id)).size, canon.episodes.length);
  assert.match(watchPass.version, /^2026-audio-pilot-0[34]$/);
  assert.equal(watchPass.coverage.watchalongEpisodes, 102);
  assert.equal(watchPass.coverage.audioAnalyzed, 101);
  assert.equal(watchPass.coverage.held, 1);
  assert.equal(watchPass.coverage.alternateAudioAnalyzed, 1);
  assert.ok(watchPass.coverage.alternateRankedCandidates >= 30);
  assert.match(watchPass.selectionPolicy, /no fixed 48-card ceiling/i);
  assert.ok(watchPass.coverage.rankedCandidates >= 3000, "evidence-scaled watchalong routes expand beyond the former fixed shelf");
  assert.equal(canon.watchPassCoverage.audioAnalyzed, 101);
  const latestPilot = watchPass.episodes.LV2rmwEA0w4;
  assert.ok(latestPilot.audit.candidateCategories["STRAIGHT TO STEVE'S ASSHOLE"] > 0 || latestPilot.audit.candidateCategories["CHARACTER SIGNAL"] > 0, "current-show route selection preserves a recurring WWAM lane");
});

test("repeated films stay separate while grouping into one movie file", () => {
  const halloweenFour = canon.groups.find((group) => group.key === "halloween-4");
  const finalChapter = canon.groups.find((group) => group.key === "friday-the-13th-part-4");
  const halloweenOriginal = canon.groups.find((group) => group.key === "halloween-1978");
  const darkKnight = canon.episodes.find((episode) => episode.id === "NuGQKLkam_U");
  assert.deepEqual(Array.from(halloweenFour.episodeIds), ["28PfRNKoSCA", "KrBhfGxsJNM"]);
  assert.deepEqual(Array.from(finalChapter.episodeIds), ["kTJXSHz9BXw", "QxJyVaAgZ_Y"]);
  assert.deepEqual(Array.from(halloweenOriginal.episodeIds), ["6VXSBDZ-3WE", "NjH2tcGvmAY"]);
  assert.equal(halloweenFour.repeatCount, 1);
  assert.equal(finalChapter.repeatCount, 1);
  assert.equal(halloweenOriginal.repeatCount, 1);
  assert.equal(darkKnight.franchiseKey, "dc");
  assert.equal(canon.episodes.find((episode) => episode.id === "LHK_KKVd8nw")?.franchiseKey, "comedy", "Freddy Got Fingered is not misfiled as Nightmare on Elm Street");
  const savedByTheBell = canon.episodes.find((episode) => episode.id === "wZqgaLkMq0U");
  const duskTillDawn = canon.episodes.find((episode) => episode.id === "K9qwSM4Eqyw");
  assert.ok(savedByTheBell?.topics.some((topic) => /bell|fight/i.test(topic.name)), "title-confirmed Saved by the Bell subject doors survive the audio pass");
  assert.ok(duskTillDawn?.topics.some((topic) => /dusk|dawn/i.test(topic.name)), "title-confirmed From Dusk Till Dawn subject doors survive the audio pass");
});

test("every episode has an official source, evidence state, and playable receipt lane", () => {
  canon.episodes.forEach((episode) => {
    assert.match(episode.id, /^[A-Za-z0-9_-]{11}$/);
    assert.match(episode.url, new RegExp(episode.id));
    assert.ok(["full-editorial-dossier", "source-brief-dossier", "caption-ledger-dossier"].includes(episode.dossier.state));
    assert.ok(Array.isArray(episode.dossier.cuts));
    assert.ok(episode.dossier.summary.length > 30);
    const whyBody = episode.dossier.fanRead?.whyThisNightMatters?.body || "";
    assert.doesNotMatch(whyBody, /\.\s+[a-z]/, `${episode.id} fan-read prose must not restart a sentence lowercase`);
    assert.doesNotMatch(whyBody, /\b(?:kill scenes|effects and gore|the mask and the look|direction and camera|score and sound|performances|lore and continuity)\s+is the\b/i, `${episode.id} fan-read prose must not give plural lanes a singular verb`);
    assert.doesNotMatch(whyBody, /\bthe full exchange\b/i, `${episode.id} fan-read prose must not expose a placeholder quote`);
  });
  const halloweenParty = canon.episodes.find((episode) => episode.id === "KrBhfGxsJNM");
  assert.equal(halloweenParty.type, "watch-party");
  assert.equal(halloweenParty.movieKey, "halloween-4");
  assert.ok(halloweenParty.dossier.cuts.length >= 10);
  assert.ok(canon.stats.fanSignalReceipts >= 10);
  assert.ok(canon.episodes.some((episode) => episode.dossier.fanSignals.length > 0));
  const heldSource = canon.episodes.find((episode) => episode.id === "AzrcgoyE7C4");
  assert.equal(heldSource.dossier.state, "source-brief-dossier");
  assert.match(heldSource.dossier.summary, /source brief/i);
  const halloween = canon.episodes.filter((episode) => episode.franchiseKey === "halloween");
  assert.equal(halloween.length, 17);
  assert.ok(halloween.every((episode) => episode.watchPass), "every Halloween source has a watch-pass record");
  assert.ok(halloween.filter((episode) => episode.watchPass.status === "audio-feature-pilot").every((episode) => episode.watchPass.candidates.length >= 12), "acquired Halloween audio keeps a ranked route");
  assert.equal(heldSource.watchPass.status, "held-age-restricted");
  assert.equal(heldSource.watchPass.candidates.length, 0);
  assert.equal(heldSource.watchPass.alternateAudio.status, "alternate-audio-feature-pilot");
  assert.ok(heldSource.watchPass.alternateAudio.candidates.length >= 30);
  assert.equal(heldSource.watchPass.alternateAudio.alignment.exactTimestampMappingEstablished, false);
  assert.equal(heldSource.watchPass.alternateAudio.candidates[0].category, "PODCAST AD / INTRO");
  assert.equal(heldSource.watchPass.alternateAudio.candidates[0].segmentKind, "podcast-ad-or-intro");
  assert.match(heldSource.watchPass.note, /duration drift/i);
  assert.equal(heldSource.dossier.cuts.length, 43, "the held H2 keeps every bounded podcast route in its local dossier");
  assert.equal(heldSource.dossier.chapters.length, 8, "the held H2 receives a source-local podcast arc instead of an empty chapter shelf");
  assert.ok(heldSource.dossier.cuts.every((cut) => cut.sourceKind === "podcast-variant" && /not a canonical YouTube timestamp/i.test(cut.evidenceBasis)));
  assert.ok(heldSource.dossier.chapters.every((chapter) => chapter.sourceKind === "podcast-variant" && chapter.sourceClock === "official WWAM podcast clock"));
  const recoveredSource = canon.episodes.find((episode) => episode.id === "tGsSV60FmX0");
  assert.equal(recoveredSource.dossier.state, "caption-ledger-dossier");
  assert.equal(recoveredSource.watchPass.status, "audio-feature-pilot");
  assert.ok(recoveredSource.watchPass.candidates.length >= 15);
  assert.ok(canon.episodes.filter((episode) => episode.id !== "sdiVxLTq67Q").every((episode) => episode.watchPass), "every full-film watchalong source has a watch-pass record; special broadcasts stay in their own lane");
  assert.ok(canon.episodes.filter((episode) => episode.watchPass && episode.watchPass.status === "audio-feature-pilot").every((episode) => episode.watchPass.media.sourceUrl.includes(episode.id)));
  assert.ok(canon.episodes.some((episode) => episode.watchPass?.label === "WATCHALONG WATCH PASS // AUDIO PILOT"));
  assert.ok(canon.episodes.some((episode) => episode.id === "ot91NhcRSdM" && episode.watchPass?.status === "audio-feature-pilot"), "newly discovered highlight cuts receive a source-local ASR/audio route");
  const signs = canon.episodes.find((episode) => episode.id === "F1DTb9zwceY");
  assert.equal(signs.dossier.caption.sourceKind, "local-whisper-transcript");
  assert.equal(signs.watchPass.status, "audio-feature-pilot");
  assert.ok(signs.watchPass.candidates.length >= 20, "public no-caption source receives an audio/ASR route");
  const audioUpgraded = canon.episodes.find((episode) => episode.id === "BIbyzMlstmM");
  assert.equal(audioUpgraded?.dossier.caption.sourceKind, "local-whisper-transcript", "a local Whisper ledger takes precedence over a matching automatic-caption file");
  const captionLedgers = canon.episodes.filter((episode) => episode.dossier.state === "caption-ledger-dossier");
  assert.equal(captionLedgers.length, 64);
  assert.ok(captionLedgers.every((episode) => /caption-aligned route|listening lead/i.test(episode.dossier.summary)), "caption-ledger summaries surface a concrete bounded receipt instead of generic machine boilerplate");
  assert.ok(canon.episodes.some((episode) => episode.watchPass?.audit?.candidateTarget > 15), "longer watchalongs receive a larger ranked browse set");
  assert.ok(canon.episodes.some((episode) => episode.watchPass?.audit?.candidateTarget > 48), "dense long tapes exceed the former 48-card ceiling");
  assert.ok(canon.episodes.filter((episode) => episode.duration >= 5400 && episode.watchPass?.status === "audio-feature-pilot").every((episode) => episode.watchPass.candidates.length >= 15), "feature-length watchalongs retain at least fifteen audio-ranked routes");
  assert.ok(canon.episodes.filter((episode) => episode.dossier.state === "caption-ledger-dossier").every((episode) => !/local caption ledger leaves|indexed doors hit|cleanest way in|jumpable guide to the room/i.test(episode.dossier.summary)), "caption-ledger recaps do not fall back to the old machine-shaped boilerplate");
  const heldHalloweenTwo = canon.episodes.find((episode) => episode.id === "AzrcgoyE7C4");
  assert.match(heldHalloweenTwo.dossier.summary, /official podcast variant contributes \d+ audio-bound routes/i);
  assert.equal(canon.episodes.filter((episode) => episode.watchPass && !/^held-/.test(episode.watchPass.status)).filter((episode) => episode.watchPass.listeningDigest?.headline).length, 101, "every acquired watchalong has a listening read");
  const audioEnriched = canon.episodes.filter((episode) => /listening shelf adds \d+ extra places/i.test(episode.dossier.summary));
  const audioCuts = audioEnriched.flatMap((episode) => episode.dossier.cuts.filter((cut) => cut.audio));
  assert.ok(audioEnriched.length >= 50, "caption-ledger watchalongs expose their audio-ranked routes in the show dossier");
  assert.ok(audioCuts.length >= 1000, "audio-ranked watchalong routes remain available as bounded dossier receipts");
  assert.ok(audioCuts.every((cut) => /canonical YouTube audio/i.test(cut.evidenceBasis) && cut.audioRank > 0), "audio dossier receipts retain their evidence boundary and rank");
  const audioBacked = canon.episodes.filter((episode) => episode.watchPass?.status === "audio-feature-pilot");
  const allAudioDossierCuts = audioBacked.flatMap((episode) => episode.dossier.cuts.filter((cut) => cut.audio));
  const nearbyCaptionContext = allAudioDossierCuts.filter((cut) => cut.captionContext && cut.captionAligned === false);
  assert.ok(nearbyCaptionContext.length > 0 && nearbyCaptionContext.length < allAudioDossierCuts.length, "caption-marker peaks retain nearby context without being relabeled as exact alignment");
  assert.ok(nearbyCaptionContext.every((cut) => /nearby source-local caption context; not exact alignment/i.test(cut.evidenceBasis) && (!cut.excerpt || /^NEARBY CAPTION CONTEXT/i.test(cut.excerpt) || /no caption fragment aligned/i.test(cut.excerpt))));
  assert.equal(audioBacked.length, 101, "every acoustically acquired watchalong retains an audio-feature route");
  assert.equal(canon.episodes.filter((episode) => episode.watchPass?.status === "caption-ledger-pilot").length, 0, "caption-only fallback is empty when every acquired transcript has a matching audio route");
  assert.ok(allAudioDossierCuts.length >= 2000, "audio-ranked routes are also carried into full editorial dossiers");
  assert.equal(canon.episodes.filter((episode) => episode.dossier.state === "full-editorial-dossier" && episode.dossier.cuts.some((cut) => cut.audio)).length, 38, "all full editorial watchalong dossiers expose their audio-ranked routes");
  assert.ok(allAudioDossierCuts.every((cut) => cut.excerpt && !/[\\[]\\s*(?:__+|music|laughter|inaudible|bleep)\\s*[\\]]/i.test(cut.excerpt)), "audio dossier excerpts remove caption-stage marker debris and expose an honest fallback when no caption aligns");
  canon.episodes.forEach((episode) => {
    const audio = episode.dossier.cuts.filter((cut) => cut.audio).sort((left, right) => left.t - right.t);
    for (let index = 1; index < audio.length; index += 1) assert.ok(audio[index].t - audio[index - 1].t >= 18, `${episode.id} audio routes do not stack duplicate windows`);
  });
});

test("watchalong canon is reachable from the Watchalongs route", () => {
  assert.match(html, /id="watchalong-canon"/);
  assert.match(html, /href="#watchalong-canon"/);
  assert.match(html, /wwam-watchalong-canon\.js/);
  assert.match(html, /watchalong-canon\.css/);
  assert.match(html, /137 MOVIE-ROOM RECEIPTS \/\/ 103 FULL-FILM SOURCES \/\/ \+6 PODCASTS \/\/ \+11 COMPANION CUTS \/\/ \+17 REVIEWS \/ REACTIONS/);
  assert.match(html, /509 livestreams.*103 YouTube watchalong canon sources.*90 current public leads.*13 legacy records.*\+6 official podcast recoveries/i);
  assert.match(html, /509 current-canon livestreams.*109 indexed full-film sources/i);
  assert.doesNotMatch(html, /PUBLIC WATCHALONG CANON \/\/ 50 SOURCES \/ 47 MOVIE FILES/);
  assert.doesNotMatch(html, /131 livestreams|50 public watchalong sources/i);
  assert.match(html, /FOURTEEN FRANCHISE WORLDS \/\/ NINETY-TWO SOURCES/);
  assert.match(ui, /MOVIE FILES \/\/ REPEATS STAY ATTACHED/);
  assert.match(ui, /function quickStartMarkup\(\)/, "the Watchalongs mount exposes a short path before audit ledgers");
  assert.match(ui, /data-wac-quick="halloween"/, "Halloween is a first-viewport door");
  assert.match(ui, /data-wac-quick="comedy"/, "the comedy vault is a first-viewport door");
  assert.match(ui, /wacMovieWorlds/, "movie worlds have a stable scroll target");
  assert.match(ui, /id="wacResultsHead"/, "franchise and movie-file changes have a stable result snap target");
  assert.match(ui, /results\.scrollIntoView/, "filter changes scroll the visitor to the refreshed episode list");
  assert.match(ui, /wac-audit-lanes/, "audit ledgers remain available after the primary browse path");
  assert.match(ui, /function episodeProofMarkup\(episode\)/, "cards expose the evidence mode and peak signal");
  assert.match(ui, /function peakDoorMarkup\(episode\)/, "audio-backed cards expose a direct local peak route");
  assert.match(ui, /function signatureLaneMarkup\(episode, moments\)/, "opened dossiers expose the recurring WWAM fast lanes");
  assert.match(ui, /wacLane-' \+ key/, "signature lanes receive direct in-dossier anchors");
  assert.match(ui, /steve: \[\], 'up-in-ya': \[\]/, "Steve's Asshole and UP IN YA are first-class lanes");
  assert.match(ui, /fanSignals\.forEach/, "fan callouts are folded into the in-dossier Fan Signal lane");
  assert.match(ui, /STRAIGHT TO STEVE'S ASSHOLE/, "Steve's lane is reserved before generic top-score lanes");
  assert.match(css, /\.wac-episode-proof/, "cards style the audio/caption evidence badge");
  assert.match(css, /\.wac-peak-door/, "cards style the direct peak route");
  assert.match(css, /\.wac-dossier-lane-nav/, "opened dossiers style a visible lane index");
  assert.match(css, /\.wac-signature-lane/, "opened dossiers style grouped signature lanes");
  assert.match(css, /scroll-margin-top: 5rem/, "dossier snap leaves room for the fixed header");
  assert.match(ui, /data-wac-group/);
  assert.match(ui, /function fanSignalsMarkup\(episode, signals\)/);
  assert.match(ui, /fanSignalsMarkup\(episode, dossier\.fanSignals\)/);
  assert.match(ui, /function watchPassMarkup\(episode\)/);
  assert.match(ui, /function alternateAudioMarkup\(pass(?:, episode)?\)/);
  assert.match(ui, /watchCandidateLabel/);
  assert.match(ui, /AUDIO FEATURE RANK/);
  assert.match(ui, /ACOUSTIC ONLY/);
  assert.match(ui, /function edgeAuditMarkup\(\)/);
  assert.match(ui, /function coverageLedgerMarkup\(\)/);
  assert.match(ui, /function companionShelfMarkup\(\)/);
  assert.match(ui, /THE OTHER MOVIE ROOMS/);
  assert.match(ui, /companionWatchalongs/);
  assert.match(ui, /MORE THAN 50\. THE AUDIT SAYS HOW MANY/);
  assert.match(ui, /YOUTUBE WATCHALONG CANON/);
  assert.match(ui, /RSS COMMENTARY RECEIPTS/);
  assert.match(ui, /THE OVERLOOKED EDGE/);
  assert.match(ui, /edgeReview/);
  assert.match(ui, /function keepPublicEdgeLinksLocal\(\)/, "public edge leads stay in the local app route");
  assert.match(ui, /function keepLocalReceiptLinks\(\)/, "bounded watchalong receipts stay in the local Show Wiki route");
  assert.match(ui, /function keepLocalJumpLinksInApp\(\)/, "watchalong receipt jumps stay in the current local page instead of opening a tab");
  assert.match(ui, /function receiptUrl\(episode, item\)/, "variant receipts have an explicit source URL lane");
  assert.match(ui, /OPEN PODCAST VARIANT AT/, "variant-clock receipts are labeled instead of masquerading as YouTube jumps");
  assert.match(ui, /data-wac-variant-seek/, "held podcast variants have in-page playable seek controls");
  assert.match(ui, /OPEN PODCAST VARIANT AT .*data-wac-variant-seek|data-wac-variant-seek=.*OPEN PODCAST VARIANT AT/, "podcast-clock dossier receipts stay inside the local player");
  assert.match(ui, /Keep podcast-clock chapters in the same local player/, "podcast-clock chapters stay inside the local player");
  assert.match(ui, /AD \/ INTRO BOUNDARY/, "podcast ad boundaries remain visibly separate from WWAM bits");
  assert.match(app, /sourceKind: moment\.sourceKind/, "cold-route receipts retain their source clock metadata");
  assert.match(app, /Podcast-variant receipts have their own in-page audio shelf/, "cold-route YouTube rails do not duplicate podcast-clock cuts");
  assert.match(ui, /PODCAST CLOCK \/\//, "variant-clock headers expose their own clock");
  assert.match(ui, /a\[href\^=\\"\?source=/, "local receipt cleanup covers dossier links");
  assert.match(ui, /\.wac-edge-shelf a\[href\^=\\"\?source=/, "the local edge selector is scoped to the adjacent shelf");
  assert.match(ui, /link\.removeAttribute\("target"\)/, "public edge leads do not open a second tab");
  assert.match(ui, /function podcastRecoveryMarkup\(\)/);
  assert.match(ui, /OFFICIAL FEED RECOVERY/);
  assert.match(ui, /<audio id=.*controls/);
  assert.match(ui, /data-wac-podcast-seek/);
  assert.match(ui, /TAPE SHAPE \/\/ SOURCE-LOCAL READ/);
  assert.match(html, /wwam-podcast-commentary-audio\.js/);
  assert.match(html, /livestream-audio-anchors\.js/);
  assert.match(html, /livestream-audio-anchors\.css/);
  assert.match(livestreamAnchors, /FIRST LISTENING ANCHORS/);
  assert.match(livestreamAnchors, /lvc-audio-candidates/);
  assert.match(livestreamAnchorsCss, /\.lvc-listening-anchors/);
  assert.match(ui, /broadDiscoveryOmissions/);
  assert.match(ui, /LISTENING READ \/\/ EVIDENCE MIX/);
  assert.match(ui, /FIRST LISTENING ANCHORS/, "show dossiers expose the first source-local listening routes");
  assert.match(ui, /function listeningReadMarkup\(pass, episode\)/, "listening anchors retain the episode-local route");
  assert.match(ui, /function listeningAnchorCandidates\(candidates\)/, "older passes without a stored digest still derive diverse anchors from bounded candidates");
  assert.match(ui, /AUDIO PASS/);
  assert.match(ui, /HALLOWEEN WATCH PASS/);
  assert.match(ui, /LISTEN FOR THE ROOM TO CHANGE/);
  assert.match(css, /\.wac-watch-pass/);
  assert.match(css, /\.wac-watch-pass-read/);
  assert.match(css, /\.wac-listening-anchors/);
  assert.match(css, /\.wac-edge-shelf/);
  assert.match(css, /\.wac-companion-shelf/);
  assert.match(css, /\.wac-coverage-ledger/);
  assert.match(css, /\.wac-podcast-recovery/);
  assert.match(css, /\.wac-podcast-moment/);
  assert.match(css, /\.wac-podcast-shape/);
  assert.match(app, /OFFICIAL WWAM PODCAST VARIANT/);
  assert.match(app, /SEPARATE PODCAST CLOCK/);
  assert.match(app, /data-alternate-jump/);
  assert.match(dossierCss, /\.source-dossier-fallback-variant/);
  assert.match(dossierCss, /\.source-dossier-fallback-variant-grid/);
  assert.match(ui, /OPEN LOCAL PODCAST WIKI/);
  assert.match(ui, /wacPodcastDossier/);
  assert.match(ui, /data-wac-podcast-dossier-seek/);
  assert.match(css, /\.wac-podcast-dossier-route/);
  assert.match(css, /\.wac-podcast-open/);
});

test("Show Wiki copy keeps rough captions playable without printing decoder soup", () => {
  assert.match(ui, /function receiptExcerpt\(/);
  assert.match(ui, /THE FULL EVIDENCE CHUTE/);
  assert.match(css, /\.wac-receipt-drawer/);
  assert.match(app, /function captionLooksNoisy\(/);
  assert.match(app, /function humanMomentReceipt\(/);
  assert.match(app, /Caption route only; press play to hear this moment/);
});

test("cold Show Wiki deep links snap to a useful local section", () => {
  assert.match(app, /fallbackSectionTargets/);
  assert.match(app, /wiki:\s*"fallback-about"/);
  assert.match(app, /inside:\s*"fallback-routes"/);
  assert.match(app, /fallbackModal\.scrollTo\(\{ top: Math\.min\(targetTop, maxScroll\), behavior: "smooth" \}\)/);
  assert.match(app, /syncSourceRoute\(sourceId, jumpAt, section \|\| "wiki", "replace"\)/);
  assert.match(dossierCss, /source-dossier-fallback \[id\]\s*\{\s*scroll-margin-top/);
});
