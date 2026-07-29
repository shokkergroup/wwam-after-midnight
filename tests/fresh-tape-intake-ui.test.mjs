import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const demo = path.join(here, "..", "public", "demo");
const html = fs.readFileSync(path.join(demo, "index.html"), "utf8");
const ui = fs.readFileSync(
  path.join(demo, "fresh-tape-intake-ui.js"),
  "utf8",
);
const mainCss = fs.readFileSync(path.join(demo, "styles.css"), "utf8");
const cssPath = path.join(demo, "fresh-tape-intake.css");
const css = fs.readFileSync(cssPath, "utf8");

function loadHelpers() {
  const sandbox = { window: {} };
  vm.createContext(sandbox);
  vm.runInContext(ui, sandbox, { filename: "fresh-tape-intake-ui.js" });
  return sandbox.window.WWAMFreshTapeIntakeUI;
}

function loadIntakeStack() {
  const sandbox = { window: {} };
  vm.createContext(sandbox);
  for (const file of [
    "wwam-channel-dna.js",
    "wwam-channel-pack-adapter.js",
    "channel-pack-contract.js",
    "fresh-tape-intake-engine.js",
    "fresh-tape-intake-ui.js",
  ]) {
    vm.runInContext(
      fs.readFileSync(path.join(demo, file), "utf8"),
      sandbox,
      { filename: file },
    );
  }
  return sandbox.window;
}

function plain(value) {
  return JSON.parse(JSON.stringify(value));
}

test("the Drop Zone is a lazy feature with a complete accessible intake surface", () => {
  assert.match(
    html,
    /id="fresh-intake"[\s\S]{0,180}data-feature-styles="fresh-tape-intake\.css"[\s\S]{0,180}data-feature-scripts="channel-pack-contract\.js,wwam-channel-pack-adapter\.js,fresh-tape-intake-engine\.js,fresh-tape-intake-ui\.js"/,
  );
  for (const id of [
    "freshIntakeProof",
    "freshIntakeForm",
    "freshSourceId",
    "freshSourceUrl",
    "freshSourceTitle",
    "freshSourceDate",
    "freshSourceDuration",
    "freshSourceLane",
    "freshTranscriptFormat",
    "freshTranscriptFile",
    "freshTranscriptContent",
    "freshIntakeRules",
    "freshIntakeRun",
    "freshIntakeSample",
    "freshIntakeBurn",
    "freshIntakeClear",
    "freshIntakeStatus",
    "freshIntakeOutput",
  ]) {
    assert.match(html, new RegExp(`id="${id}"`));
  }
  assert.match(
    html,
    /id="freshIntakeStatus"[^>]*role="status"[^>]*aria-live="polite"[^>]*aria-atomic="true"/,
  );
  assert.match(html, /accept="\.vtt,\.srt,\.json,\.json3,\.txt/);
});

test("the Drop Zone stylesheet is a bounded lazy asset, not first-load CSS", () => {
  assert.equal(fs.existsSync(cssPath), true);
  assert.ok(fs.statSync(cssPath).size < 25_000);
  assert.match(css, /V5\.6 .* local Fresh Tape Intake airlock/);
  assert.match(css, /\.fresh-intake\s*\{/);
  assert.doesNotMatch(mainCss, /V5\.6 .* local Fresh Tape Intake airlock/);
  assert.doesNotMatch(
    html,
    /<link[^>]+href="fresh-tape-intake\.css"/i,
  );
});

test("the UI compiles the real ChannelPack and cannot bypass engine quarantine", () => {
  assert.match(
    ui,
    /ShokkerChannelPack\.compile\(\s*root\.WWAM_CHANNEL_DNA,\s*root\.WWAM_CHANNEL_PACK_ADAPTER\s*\)/,
  );
  assert.match(
    ui,
    /ShokkerFreshTapeIntakeEngine\.create\(\{\s*channelPack:\s*channelPack,\s*rules:\s*rules\(\)/,
  );
  assert.match(ui, /engine\.intake\(\{/);
  assert.match(ui, /engine\.verifyExport\(artifact\)/);
  assert.match(ui, /engine\.serialize\(artifact\)/);
  assert.doesNotMatch(ui, /\bfetch\s*\(/);
  assert.doesNotMatch(ui, /XMLHttpRequest|WebSocket|localStorage|sessionStorage/);
  assert.doesNotMatch(ui, /\bpromote\b\s*\(|promotionAllowed\s*=\s*true/i);
});

test("the URL and duration helpers normalize useful input and reject ambiguity", () => {
  const helpers = loadHelpers();
  assert.equal(helpers.youtubeId("LocalDemo01"), "LocalDemo01");
  assert.equal(
    helpers.youtubeId(
      "https://www.youtube.com/watch?feature=share&v=LocalDemo01&t=5",
    ),
    "LocalDemo01",
  );
  assert.equal(
    helpers.youtubeId("https://youtu.be/LocalDemo01?si=proof"),
    "LocalDemo01",
  );
  assert.equal(
    helpers.youtubeId(
      "https://youtube.com/watch?v=LocalDemo01&v=OtherTape01",
    ),
    "",
  );
  assert.equal(helpers.youtubeId("https://example.com/LocalDemo01"), "");

  assert.equal(helpers.durationSeconds("180.5"), 180.5);
  assert.equal(helpers.durationSeconds("02:30"), 150);
  assert.equal(helpers.durationSeconds("02:03:04"), 7384);
  assert.equal(Number.isNaN(helpers.durationSeconds("00:72")), true);
  assert.equal(Number.isNaN(helpers.durationSeconds("0")), true);
});

test("file detection keeps every supported transcript format explicit", () => {
  const helpers = loadHelpers();
  assert.equal(helpers.detectFormat("tape.vtt", "anything"), "webvtt");
  assert.equal(
    helpers.detectFormat("", "WEBVTT\n\n00:00.000 --> 00:01.000\nline"),
    "webvtt",
  );
  assert.equal(
    helpers.detectFormat(
      "",
      "1\n00:00:01,000 --> 00:00:02,000\nline",
    ),
    "srt",
  );
  assert.equal(
    helpers.detectFormat("captions.json3", '{"events":[]}'),
    "youtube-json3",
  );
  assert.equal(helpers.detectFormat("notes.txt", "untimed notes"), "plain-text");
});

test("the heat arc is deterministic, chronological, and bound to exact candidates", () => {
  const helpers = loadHelpers();
  const candidates = [
    { at: 5, label: "SCREAM", timecodeUrl: "https://youtube.test?t=5s" },
    { at: 19, label: "SCREAM", timecodeUrl: "https://youtube.test?t=19s" },
    { at: 51, label: "HALLOWEEN", timecodeUrl: "https://youtube.test?t=51s" },
    { at: 119, label: "ROOM BREAK", timecodeUrl: "https://youtube.test?t=119s" },
  ];
  const chapters = plain(helpers.chaptersFor(candidates, 120, 8));

  assert.equal(chapters.length, 8);
  assert.deepEqual(
    chapters.map((chapter) => chapter.count),
    [1, 1, 0, 1, 0, 0, 0, 1],
  );
  assert.equal(chapters[0].start, 0);
  assert.equal(chapters.at(-1).end, 120);
  assert.equal(chapters[3].firstCandidate.timecodeUrl, candidates[2].timecodeUrl);
  assert.equal(chapters.every((chapter) => chapter.heatPercent >= 0), true);
});

test("synthetic proof and real-source boundaries remain impossible to confuse", () => {
  assert.match(ui, /LOCAL DEMO \/\/ SYNTHETIC \/\/ NOT ARCHIVE PROOF/);
  assert.match(ui, /LOCAL INTAKE \/\/ CHANNEL OWNERSHIP UNVERIFIED/);
  assert.match(ui, /SYNTHETIC LOCAL DEMO LOADED \/\/ NOT A WWAM SOURCE/);
  assert.match(html, /Invented transcript \/\/ not a WWAM upload \/\/ not archive proof/);
  assert.match(html, /cannot identify a speaker/);
  assert.match(ui, /SPEAKER UNKNOWN/);
  assert.match(ui, /NOT DIARIZED/);
  assert.match(ui, /HUMAN REVIEW REQUIRED/);
});

test("the bundled synthetic demo survives the real engine without gaining authority", () => {
  const window = loadIntakeStack();
  const helpers = window.WWAMFreshTapeIntakeUI;
  const sample = helpers.sample;
  const channelPack = window.ShokkerChannelPack.compile(
    window.WWAM_CHANNEL_DNA,
    window.WWAM_CHANNEL_PACK_ADAPTER,
  );
  const engine = window.ShokkerFreshTapeIntakeEngine.create({
    channelPack,
    rules: helpers.rules(),
  });
  const artifact = engine.intake({
    source: {
      id: sample.id,
      url: sample.url,
      title: sample.title,
      date: sample.date,
      durationSeconds: helpers.durationSeconds(sample.duration),
      lane: sample.lane,
    },
    transcript: {
      format: sample.format,
      sourceId: sample.id,
      content: sample.transcript,
    },
  });

  assert.equal(artifact.status, "quarantined");
  assert.ok(artifact.candidates.length >= 8);
  assert.ok(artifact.evidenceLedger.entries.length >= 5);
  assert.equal(artifact.policy.promotionAllowed, false);
  assert.equal(artifact.policy.speakerInference, false);
  assert.equal(artifact.source.channelOwnershipVerified, false);
  assert.equal(
    artifact.candidates.every(
      (candidate) =>
        candidate.speaker === null &&
        candidate.speakerStatus === "not-diarized",
    ),
    true,
  );
  const verification = engine.verifyExport(artifact);
  assert.equal(verification.ok, true);
  assert.equal(verification.scope, "structural-change-detection-only");
  assert.equal(verification.authenticityVerified, false);
});

test("held plain text, bounded rendering, and checked exports are visible product states", () => {
  assert.match(ui, /HELD\. NO CLOCK, NO MOMENT CLAIM\./);
  assert.match(ui, /0 DERIVED CANDIDATES/);
  assert.match(ui, /artifact\.status === "held"/);
  assert.match(ui, /visibleCandidates = 36/);
  assert.match(ui, /candidates\.slice\(0, visibleCandidates\)/);
  assert.match(ui, /data-fresh-more/);
  assert.match(ui, /STRUCTURAL RESTORE CHECK PASSED/);
  assert.match(ui, /AUTHENTICITY NOT VERIFIED/);
  assert.match(ui, /CHECKSUM IS NOT A SIGNATURE/);
  assert.match(ui, /artifact\.evidenceLedger\.entries\.length/);
  assert.match(ui, /RAW TRANSCRIPT OMITTED/);
  assert.match(
    ui,
    /COPY BLOCKED \/\/ DOWNLOAD THE STRUCTURE-CHECKED ARTIFACT INSTEAD/,
  );
});

test("all transcript-derived public text is escaped before it reaches markup", () => {
  assert.match(ui, /esc\(displayText\(artifact\.source\.title\)\)/);
  assert.match(ui, /esc\(candidate\.label\)/);
  assert.match(ui, /esc\(displayText\(candidate\.excerpt\.text\)\)/);
  assert.match(ui, /esc\(candidate\.timecodeUrl\)/);
  assert.match(ui, /esc\(error\.code \|\| error\.message \|\| String\(error\)\)/);
  assert.doesNotMatch(ui, /innerHTML\s*=\s*elements\.transcript\.value/);
});

test("the intake layout collapses cleanly for tablets and phones", () => {
  assert.match(
    css,
    /@media \(max-width: 1180px\)[\s\S]*?\.intake-workbench\s*\{\s*grid-template-columns:\s*1fr;/,
  );
  assert.match(
    css,
    /@media \(max-width: 820px\)[\s\S]*?\.intake-result-grid\s*\{\s*grid-template-columns:\s*1fr;/,
  );
  assert.match(
    css,
    /@media \(max-width: 600px\)[\s\S]*?\.intake-form-grid,[\s\S]*?\.intake-form-actions\s*\{\s*grid-template-columns:\s*1fr;/,
  );
});
