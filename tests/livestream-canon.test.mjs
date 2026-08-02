import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";

const root = path.resolve(".");
function loadCanon() {
  const source = fs.readFileSync(path.join(root, "public/demo/wwam-livestream-canon.js"), "utf8");
  const sandbox = { window: {} };
  vm.createContext(sandbox);
  vm.runInContext(source, sandbox);
  return sandbox.window.WWAM_LIVESTREAM_CANON;
}

test("livestream canon contains the complete source registry", () => {
  const canon = loadCanon();
  assert.equal(canon.schema, "shokker-wwam-livestream-canon/v1");
  assert.equal(canon.stats.episodes, 509);
  assert.equal(canon.episodes.length, 509);
  assert.equal(new Set(canon.episodes.map((episode) => episode.id)).size, 509);
  assert.equal(canon.episodes[0].id, "LV2rmwEA0w4");
  assert.equal(canon.episodes.at(-1).date, "2016-02-01");
  assert.equal(canon.yearIndex["2026"].episodeCount, 37);
  assert.equal(canon.stats.yearPassEpisodes, 37);
  assert.ok(canon.stats.audioPassCoverage.audioAnalyzed >= 508, "recovery shelves keep at least the currently verified audio coverage");
  assert.equal(canon.stats.audioPassCoverage.livestreamEpisodes, 509);
  assert.ok(Array.isArray(canon.stats.audioPassCoverage.years));
  assert.ok(canon.stats.audioPassCoverage.years.includes("2026"));
  assert.equal(canon.stats.audioPassCoverage.yearCoverage["2026"].audioAnalyzed, 37);
  assert.ok(canon.stats.audioPassCoverage.yearCoverage["2023"].audioAnalyzed >= 70);
  assert.ok(canon.stats.audioPassCoverage.captionFallback <= 1, "only genuinely unavailable recovery shelves remain caption-only");
  assert.ok(canon.stats.audioPassCoverage.yearCoverage["2018"].audioAnalyzed >= 10);
  assert.ok((canon.stats.audioPassCoverage.yearCoverage["2018"].captionFallback || 0) <= 1);
  assert.ok(canon.stats.audioPassCoverage.yearCoverage["2019"].audioAnalyzed >= 33);
  assert.ok((canon.stats.audioPassCoverage.yearCoverage["2019"].captionFallback || 0) <= 1);
  assert.ok(canon.stats.audioPassCoverage.yearCoverage["2020"].audioAnalyzed >= 68);
  assert.ok((canon.stats.audioPassCoverage.yearCoverage["2020"].captionFallback || 0) <= 1);
  assert.ok(canon.stats.audioPassCoverage.yearCoverage["2021"].audioAnalyzed >= 74);
  assert.ok((canon.stats.audioPassCoverage.yearCoverage["2021"].captionFallback || 0) <= 1);
  assert.equal(canon.stats.rssAudioMirrors, 2);
  assert.ok(canon.episodes.find((episode) => episode.id === "LVVGdGxTBfI")?.rssAudioPass?.media?.canonicalTimestampMapping === false);
  assert.equal(canon.episodes.filter((episode) => episode.dossier?.audioRead?.mode === "decoded-audio").length, 508);
  assert.equal(canon.episodes.filter((episode) => episode.dossier?.audioRead?.mode === "caption-only").length, 1);
});

test("repeated livestream headlines receive date-qualified navigation titles", () => {
  const canon = loadCanon();
  const groups = new Map();
  for (const episode of canon.episodes) {
    const key = episode.title.trim().toLowerCase();
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(episode);
  }
  const repeated = [...groups.values()].filter((group) => group.length > 1);
  assert.ok(repeated.length >= 10);
  for (const group of repeated) {
    assert.ok(group.every((episode) => episode.displayTitle && episode.displayTitle.includes(episode.date)));
    assert.equal(new Set(group.map((episode) => episode.displayTitle)).size, group.length);
  }
  assert.equal(canon.episodes.filter((episode) => episode.displayTitle).length, 36);
});

test("each source has an honest evidence tier and playable source link", () => {
  const canon = loadCanon();
  const allowed = new Set(["distill-dossier", "completion-dossier", "caption-ledger", "source-brief"]);
  for (const episode of canon.episodes) {
    assert.equal(episode.publicSource, true);
    assert.match(episode.url, /^https:\/\/www\.youtube\.com\/watch\?v=/);
    assert.ok(allowed.has(episode.evidenceTier));
    assert.ok(episode.dossier && episode.dossier.summary);
    assert.ok(Array.isArray(episode.topics));
    assert.ok(Array.isArray(episode.chapters));
    assert.ok(Array.isArray(episode.moments));
    assert.ok(Array.isArray(episode.fanSignals));
    assert.ok(Array.isArray(episode.recurringBits));
    assert.ok(Array.isArray(episode.bestBits));
    assert.ok(Array.isArray(episode.characterCues));
    assert.ok(Array.isArray(episode.conversationThreads));
    for (const signal of episode.fanSignals) assert.ok(signal.signalType);
    for (const lane of episode.recurringBits) {
      assert.ok(lane.candidateCount >= 1);
      assert.ok(Array.isArray(lane.receipts));
      assert.ok(lane.receipts.every((receipt) => Number.isFinite(receipt.t)));
    }
    for (const character of episode.characterCues) {
      assert.ok(character.name && character.mentions > 0);
      assert.ok(Array.isArray(character.receipts) && character.receipts.length > 0);
    }
  }
  assert.ok(canon.stats.completionDossiers >= 200);
  assert.ok(canon.stats.distillDossiers >= 10);
  assert.ok(canon.stats.captionLedgers >= 200);
  assert.ok(canon.stats.latestOutsideAtlas > 0);
  assert.ok(canon.stats.fanSignalReceipts > 0);
  assert.ok(canon.stats.recurringBitReceipts >= canon.stats.fanSignalReceipts);
  assert.ok(canon.stats.characterCueReceipts > 0);
  const captionFallbacks = canon.episodes.filter((episode) => episode.watchPass?.status === "caption-ledger-pass");
  assert.ok(captionFallbacks.length <= 1);
  assert.ok(captionFallbacks.every((episode) => episode.watchPass.candidates.length >= 9 && episode.watchPass.candidates.every((candidate) => !candidate.audio && /canonical audio unavailable/i.test(candidate.evidenceBasis))), "held shows retain caption-only routes without acoustic claims");
  const captionLaneTotals = captionFallbacks.reduce((totals, episode) => {
    Object.entries(episode.watchPass.audit.candidateCategories || {}).forEach(([lane, count]) => { totals[lane] = (totals[lane] || 0) + Number(count || 0); });
    return totals;
  }, {});
  if (captionFallbacks.length) {
    assert.ok(captionLaneTotals["STRAIGHT TO STEVE'S ASSHOLE"] >= 3, "caption-only holds retain a negative-take shelf");
    assert.ok(captionLaneTotals["WWAM UP IN YA"] >= 1, "caption-only holds retain an explicit vulgarity shelf");
    assert.ok(captionLaneTotals["CHARACTER SIGNAL"] >= 1, "caption-only holds retain character-cue routes");
  }
  if (captionFallbacks.length) assert.ok(captionLaneTotals["FAN SIGNAL"] >= 1, "caption-only holds retain fan-callout routes");
  assert.ok(Array.isArray(canon.fanHall) && canon.fanHall.length > 0);
  assert.ok(Array.isArray(canon.characterIndex) && canon.characterIndex.some((entry) => entry.name === "Dr. Loomis"));
  assert.ok(canon.fanHall.every((entry) => entry.receipts > 0 && entry.episodeIds.length > 0));
  assert.ok(canon.episodes.some((episode) => episode.moments.length > 40), "long shows retain more than forty candidates when the tape supports them");
  const year2026 = canon.episodes.filter((episode) => episode.year === 2026);
  assert.equal(year2026.length, 37);
  assert.ok(year2026.every((episode) => episode.yearPass && episode.yearPass.version === "2026-wave-01"));
  assert.ok(year2026.every((episode) => episode.yearPass.sceneBeats.length >= 4));
  assert.ok(year2026.every((episode) => episode.yearPass.sceneBeats.some((beat) => beat.receipt)), "the second pass keeps a bounded tape receipt in every year map");
  assert.ok(year2026.every((episode) => episode.conversationThreads.length >= 4), "2026 episodes retain a chronological topic thread map");
  assert.ok(year2026.some((episode) => episode.bestBits.length > 5), "best-bit candidates are not silently capped at five");
  const latestThree = ["LV2rmwEA0w4", "iz0WFhe6LYM", "ag3axSC9BpU"].map((id) => canon.episodes.find((episode) => episode.id === id));
  assert.ok(latestThree.every((episode) => episode.watchPass && episode.watchPass.status === "audio-feature-pass"));
  assert.ok(latestThree.every((episode) => episode.watchPass.candidates.length >= 12), "the latest-three pilot retains a substantial ranked audio route");
  assert.ok(latestThree.every((episode) => episode.watchPass.media.audioOnly === true));
  assert.ok(latestThree.every((episode) => episode.watchPass.candidates.every((candidate) => candidate.audio && candidate.evidenceBasis.includes("canonical YouTube audio"))));
  assert.ok(canon.yearIndex["2026"].topTopics.length > 0);
  assert.ok(canon.yearIndex["2026"].topLanes.length > 0);
  const ledgerSummaries = canon.episodes.filter((episode) => episode.evidenceTier === "caption-ledger").map((episode) => episode.dossier.summary);
  assert.ok(ledgerSummaries.length >= 200);
  assert.equal(canon.episodes.some((episode) => /Ranked #\d+ among eligible archived livestreams|Selected #\d+ by the frozen Archive Atlas|caption map concentrates on|This completion pass maps/i.test(episode.dossier.summary)), false, "episode summaries do not retain the old ranking/metadata boilerplate");
  assert.ok(canon.episodes.every((episode) => episode.dossier.summary.length >= 220), "every show summary gives the visitor a real conversational read");
  assert.equal(ledgerSummaries.some((summary) => /\bA open-line\b/i.test(summary)), false);
  assert.equal(ledgerSummaries.some((summary) => summary.includes("Open the timestamp before treating")), false);
  assert.equal(canon.episodes.some((episode) => /caption trail keeps returning|spends its time bouncing|built around/i.test(`${episode.dossier.summary} ${episode.dossier.tapeNote || ""}`)), false, "livestream copy does not turn topic doors into whole-show claims");
  assert.ok(canon.episodes.every((episode) => episode.dossier.audioRead && Number.isInteger(episode.dossier.audioRead.routeCount)), "every show exposes an explicit listening-read state");
  assert.ok(canon.episodes.filter((episode) => episode.dossier.audioRead.mode === "decoded-audio").every((episode) => /decoded audio pass/i.test(episode.dossier.summary)), "decoded audio state is reflected in the show read");
  const heldCaptionEpisode = canon.episodes.find((episode) => episode.id === "LVVGdGxTBfI");
  assert.ok(heldCaptionEpisode && /caption-only fallback/i.test(heldCaptionEpisode.dossier.summary), "the held source states its caption-only boundary");
  assert.equal(/The decoded audio pass adds/i.test(heldCaptionEpisode.dossier.summary), false, "caption-only source is never described as decoded audio");
  const tapeNotes = canon.episodes.map((episode) => episode.dossier.tapeNote || "");
  assert.equal(tapeNotes.some((note) => /indexed doors|source-local map keeps|loudest recurring lane|cleanest first play|room also leaves/i.test(note)), false, "episode tape notes do not use the old machine-shaped boilerplate");
  assert.ok(tapeNotes.some((note) => /dominant recurring lane|fan ledger catches/i.test(note)), "episode tape notes retain a human-readable listening read");
  assert.ok(ledgerSummaries.some((summary) => /fan traffic is part|retained callouts/i.test(summary)));
  assert.equal(canon.episodes.some((episode) => /\b1 (?:signal receipts|fan-signal receipts)\b/i.test(`${episode.dossier.summary} ${episode.dossier.tapeNote || ""}`)), false, "single fan receipts use singular grammar");
});

test("audio watch-pass receipts are marker-clean and disclose caption alignment", () => {
  const canon = loadCanon();
  const candidates = canon.episodes.flatMap((episode) => (episode.watchPass?.candidates || []).map((candidate) => ({ ...candidate, episode: episode.id })));
  assert.ok(candidates.length >= 1700, "2026 audio pass retains its ranked candidate shelf");
  assert.ok(candidates.every((candidate) => typeof candidate.captionAligned === "boolean" && candidate.captionExcerpt), "each audio candidate discloses whether a caption fragment aligned and has an honest fallback");
  assert.ok(candidates.every((candidate) => !/[\\[]\\s*(?:__+|music|laughter|inaudible|bleep)\\s*[\\]]/i.test(candidate.captionExcerpt || "")), "livestream audio candidates remove caption-stage marker debris");
  const visibleReceipts = canon.episodes.flatMap((episode) => [
    ...(episode.moments || []), ...(episode.chapters || []), ...(episode.bestBits || []), ...(episode.fanSignals || []),
    ...(episode.recurringBits || []).flatMap((lane) => lane.receipts || []), ...(episode.yearPass?.sceneBeats || []),
    ...(episode.characterCues || []).flatMap((character) => character.receipts || [])
  ]);
  assert.ok(visibleReceipts.every((receipt) => !/[\\[]\\s*(?:__+|music|laughter|inaudible|bleep)\\s*[\\]]/i.test(receipt.excerpt || receipt.receipt || "")), "visible livestream receipts remove caption-stage marker debris");
});

test("livestream audio recovery queue is incremental by default", () => {
  const passScript = fs.readFileSync(path.join(root, "scripts/run_wwam_2026_livestream_audio_watch_pass.py"), "utf8");
  assert.match(passScript, /parser\.add_argument\("--refresh"/, "full re-decode remains an explicit opt-in");
  assert.match(passScript, /preserved existing audio-feature record/, "verified local audio is not decoded again on every heartbeat");
  assert.match(passScript, /existing\.get\("status"\) == "audio-feature-pass"/, "the skip guard is limited to verified audio records");
});

test("livestream canon surface is wired into the page and route shell", () => {
  const html = fs.readFileSync(path.join(root, "public/demo/index.html"), "utf8");
  const guided = fs.readFileSync(path.join(root, "public/demo/guided-shell.js"), "utf8");
  const gate = fs.readFileSync(path.join(root, "public/demo/route-render-gate.js"), "utf8");
  const ui = fs.readFileSync(path.join(root, "public/demo/livestream-canon-ui.js"), "utf8");
  const css = fs.readFileSync(path.join(root, "public/demo/livestream-canon.css"), "utf8");
  assert.match(ui, /ACOUSTIC ONLY/, "livestream audio routes visibly disclose acoustic-only listening cues");
  assert.match(ui, /AUDIO DECODED/, "livestream cards visibly disclose locally decoded audio coverage");
  assert.match(ui, /CAPTION ROUTE/, "livestream cards visibly disclose caption-only coverage");
  assert.match(ui, /SOURCE BRIEF/, "livestream cards visibly disclose metadata-only coverage");
  assert.match(html, /id="livestream-canon"/);
  assert.match(html, /wwam-livestream-canon\.js/);
  assert.match(html, /wwam-livestream-audio-pass\.js/);
  assert.match(html, /wwam-livestream-rss-audio-pass\.js/);
  assert.match(html, /livestream-canon-ui\.js/);
  assert.match(guided, /"livestream-canon": "shows"/);
  assert.match(guided, /#livestream-canon/);
  assert.match(gate, /"livestream-canon": "shows"/);
  assert.match(ui, /OPEN FULL SHOW WIKI/);
  assert.match(ui, /data-lvc-open/);
  assert.match(ui, /NEW SINCE ATLAS/);
  assert.match(ui, /RECURRING BITS/);
  assert.match(ui, /WWAM FAM HALL/);
  assert.match(ui, /CHARACTER CUES/);
  assert.match(ui, /TAPE HOOK/);
  assert.match(ui, /2026 SECOND PASS/);
  assert.match(ui, /THE ROUTE THROUGH THIS NIGHT/);
  assert.match(ui, /TAPE NOTE/);
  assert.match(ui, /ALL RECEIPTS, RANKED/);
  assert.match(ui, /CONVERSATION THREADS/);
  assert.match(ui, /AUDIO WATCH PASS/);
  assert.match(ui, /AUDIO PASSES/);
  assert.match(ui, /CAPTION FALLBACKS/);
  assert.match(ui, /CAPTION-ONLY PASS/);
  assert.match(ui, /function u\(e,a\)\{return "\?source="/, "bounded livestream jumps use the local Show Wiki route");
  assert.match(ui, /keepLocalJumpLinksInApp/, "local livestream routes do not open a second external tab");
  assert.match(ui, /official YouTube player at its bounded timestamp/, "local route copy explains the embedded source boundary");
  assert.match(ui, /THE PODCAST TAPE/);
  assert.match(ui, /data-lvc-rss-seek/);
  assert.match(ui, /LISTEN FOR THE ROOM TO CHANGE/);
  assert.doesNotMatch(ui, /moments\|\|\[\]\)\.slice\(0,40\)/);
  assert.match(css, /\.lvc-card-grid/);
  assert.match(css, /\.lvc-new/);
  assert.match(css, /\.lvc-audio-pass/);
});
