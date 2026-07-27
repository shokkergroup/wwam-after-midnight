import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const demo = path.join(here, "..", "public", "demo");
const index = fs.readFileSync(path.join(demo, "index.html"), "utf8");
const app = fs.readFileSync(path.join(demo, "app.js"), "utf8");
const search = fs.readFileSync(path.join(demo, "search-engine.js"), "utf8");
const askShare = fs.readFileSync(path.join(demo, "ask-share.js"), "utf8");
const trivia = fs.readFileSync(path.join(demo, "tape-trivia-engine.js"), "utf8");
const styles = fs.readFileSync(path.join(demo, "styles.css"), "utf8");

test("the complete browser script chain exists in dependency order", () => {
  const scripts = [...index.matchAll(/<script src="([^"]+)"><\/script>/g)]
    .map((match) => match[1].split("?")[0]);
  const required = [
    "catalog.js",
    "deep-distill.js",
    "livestream-distill.js",
    "popular-live-distill.js",
    "curation.js",
    "character-lore.js",
    "character-engine.js",
    "wwam-channel-dna.js",
    "showcase-engine.js",
    "lore-engine.js",
    "tape-trivia-engine.js",
    "night-shift-engine.js",
    "creator-studio-engine.js",
    "cold-open-engine.js",
    "canon-integrity-engine.js",
    "human-review-session-engine.js",
    "search-engine.js",
    "ask-share.js",
    "youtube-playback.js",
    "feature-loader.js",
    "app.js",
    "context-atlas.js",
    "context-companion.js",
    "guided-shell.js",
    "wwam-dossier-editorial.js",
    "wwam-night-guide.js",
  ];
  assert.deepEqual(scripts, required);
  required.forEach((file) => assert.equal(fs.existsSync(path.join(demo, file)), true, `${file} is missing`));
  ["correction-ripple-engine.js", "trust-engine.js"].forEach((file) => {
    assert.doesNotMatch(index, new RegExp(`<script[^>]+${file.replace(".", "\\.")}`, "i"));
    assert.equal(fs.existsSync(path.join(demo, file)), true);
  });
  assert.match(
    app,
    /loadDemoScript\("correction-ripple-engine\.js"\)[\s\S]{0,120}loadDemoScript\("trust-engine\.js"\)[\s\S]{0,80}then\(createCreatorEngines\)/,
  );
  assert.match(
    app,
    /loadDemoScript\("pilot-builder-engine\.js"\)\.then\(createCreatorEngines\)/,
  );
  assert.doesNotMatch(index, /<script[^>]+src="pilot-builder-engine\.js"/);
  assert.match(app, /loadDemoScript\("canon-desk-ui\.js\?v=1\.0\.1"\)\.then\(createCreatorEngines\)/);
  assert.equal(fs.existsSync(path.join(demo, "canon-desk-ui.js")), true);
});

test("every deep surface has a renderer and an isolated initialization stage", () => {
  const functions = new Set(
    [...app.matchAll(/\bfunction\s+([A-Za-z_$][\w$]*)\s*\(/g)].map((match) => match[1]),
  );
  [
    "scheduleIdle",
    "createDeepEngines",
    "createFanEngines",
    "createCreatorEngines",
    "renderLore",
    "renderNightShift",
    "renderTrivia",
    "renderClipLab",
    "renderCanon",
    "renderHumanReviewSession",
    "renderPilotBuilder",
  ].forEach((name) => assert.equal(functions.has(name), true, `${name} is not defined`));

  assert.match(app, /scheduleIdle\(createFanEngines,/);
  assert.match(app, /scheduleIdle\(createCreatorEngines,/);
  assert.match(app, /function createFanEngines\(\)[\s\S]*renderLore\(\);[\s\S]*renderTrivia\(\);/);
  assert.match(app, /function createCreatorEngines\(\)[\s\S]*renderClipLab\(\);[\s\S]*renderCanon\(\);/);
});

test("new interactive surface hooks exist in both HTML and application wiring", () => {
  const ids = [
    "loreSearch",
    "loreResults",
    "loreDossier",
    "constellationMap",
    "triviaDifficulty",
    "triviaLength",
    "triviaFranchise",
    "triviaStart",
    "triviaStage",
    "nightShiftStage",
    "clipSearch",
    "clipRisk",
    "clipResults",
    "campaignCopy",
    "campaignDownload",
    "campaignClear",
    "canonStage",
    "pilotBuilder",
    "evidenceBag",
  ];
  ids.forEach((id) => {
    assert.match(index, new RegExp(`id="${id}"`), `${id} is missing from index.html`);
    assert.match(app, new RegExp(`(?:getElementById|querySelector)\\("${id}|#${id}`), `${id} is not wired in app.js`);
  });

  assert.match(index, /id="canonTabs"/, "canonTabs is missing from index.html");
  assert.match(index, /data-canon-tab=/, "Canon Desk tab controls are missing from index.html");
  assert.match(app, /querySelectorAll\("\[data-canon-tab\]"\)/, "Canon Desk tabs are not wired in app.js");
});

test("V5.2 daily return, human review, and pilot proof are real wired systems", () => {
  assert.match(index, /id="night-shift"/);
  assert.match(index, /id="nightShiftStage"/);
  assert.match(app, /WWAMNightShiftEngine\.create/);
  assert.match(app, /nightShiftEngine\.createDaily/);
  assert.match(app, /nightShiftEngine\.restoreProgress/);
  assert.match(app, /nightShiftProgress\.completeCurrent/);
  assert.match(app, /searchParams\.set\("nightShift"/);
  assert.match(styles, /\.night-shift-section/);
  assert.match(styles, /\.night-shift-grid/);

  assert.match(index, /data-canon-tab="session"/);
  assert.match(app, /WWAMHumanReviewSession\.create/);
  assert.match(app, /WWAMHumanReviewSession\.restore/);
  assert.match(app, /humanReviewSession\.recordDecision/);
  assert.match(app, /CANON, SPEAKER, AND CREATOR CERTIFICATION REMAIN FALSE/);
  assert.match(app, /reviewForm\.checkValidity/);
  assert.match(app, /wwam-human-review-v52-quarantine/);
  assert.match(app, /RECORDED IN THIS TAB ONLY/);
  assert.match(app, /reviewAttestation/);
  assert.match(styles, /\.review-session-grid/);

  assert.match(index, /id="pilotBuilder"/);
  assert.match(app, /WWAMCreatorPilotBuilder\.create/);
  assert.match(app, /pilotBuilderEngine\.build/);
  assert.match(app, /pilotBuilderEngine\.verify/);
  assert.match(app, /exportMarkdown/);
  assert.match(app, /CONSISTENCY CHECK PASSED/);
  assert.doesNotMatch(app, /TAMPER CHECK PASSED/);
  assert.match(styles, /\.pilot-builder/);
});

test("V5.2 mode and tab selections expose state and restore keyboard focus", () => {
  assert.match(index, /role="tablist" aria-label="Canon Desk views"/);
  assert.match(index, /role="tab" aria-selected="true"/);
  assert.match(app, /setAttribute\("aria-selected"/);
  assert.match(app, /data-night-mode=[\s\S]{0,120}aria-pressed=/);
  assert.match(app, /data-pilot-goal=[\s\S]{0,120}aria-pressed=/);
  assert.match(app, /button\.setAttribute\("aria-pressed", on\)/);
  assert.match(index, /id="clipModes" role="group" aria-label="Clip Lab mode"/);
  assert.match(app, /activeHeading\.focus\(\)/);
  assert.match(app, /selectedGoal\.focus\(\)/);
});

test("Clip Lab UI honors the engine risk contract and persists exact derived ledgers", () => {
  assert.match(app, /filters\.maxRisk = state\.clipRisk/);
  assert.doesNotMatch(app, /filters\.risk = state\.clipRisk/);
  assert.match(app, /clipLabEngine\.snapshotSelection/);
  assert.match(app, /clipLabEngine\.restoreSelection/);
  assert.match(app, /campaignSnapshots/);
  assert.doesNotMatch(
    app,
    /id\.indexOf\(":filter:"\)[\s\S]{0,120}id\.split\(":filter:"\)\[0\]/,
    "Filtered campaign IDs must never fall back to their wider base bundle"
  );
  assert.match(app, /state\.campaignIds\.length >= 24/);
});

test("Cold Open Factory is a working fourth Clip Lab mode with source-ledgered exports", () => {
  assert.match(index, /data-clip-mode="cold-open"/);
  assert.match(app, /WWAMColdOpenFactory\.create\(\{ clipLab: clipLabEngine \}\)/);
  assert.match(app, /coldOpenFactory\.getStoryboards\(filters\)/);
  assert.match(app, /function coldOpenCard\(board\)/);
  assert.match(app, /COPY EDIT DECISION LIST/);
  assert.match(app, /DOWNLOAD STORYBOARD JSON/);
  assert.match(app, /SPEAKER NOT ASSIGNED/);
  assert.match(styles, /\.cold-open-timeline/);
  assert.match(styles, /\.cold-open-format-bar/);
});

test("trust-sensitive public copy keeps archive boundaries visible", () => {
  assert.match(search, /EARLIEST MACHINE-INDEXED CHARACTER SIGNAL|machine-indexed character signal/i);
  assert.match(app, /EARLIEST TIMESTAMP-VALIDATED CURATED PERFORMANCE RECEIPT/);
  assert.match(app, /MACHINE-SURFACED ARGUMENT BOARD/);
  assert.match(app, /not speaker-diarized/i);
  assert.match(index, /Graph receipt links/i);
});

test("Trust Desk correction exports make the dry-run ripple visible", () => {
  assert.match(app, /COPY PACKET \+ RIPPLE/);
  assert.match(app, /RIPPLE COPIED \/\/ [\s\S]{0,120}affectedSurfaces/);
  assert.match(app, /RIPPLE BLOCKED \/\/ UNRESOLVED EVIDENCE/);
});

test("Ask answers and Showcase Mode proofs leave reproducible deep links", () => {
  assert.match(app, /function askShareUrl\(query\)/);
  assert.match(app, /WWAMAskShare\.build\(location\.href,\s*query,\s*state\.askContext\)/);
  assert.match(app, /WWAMAskShare\.read\(location\.search\)/);
  assert.match(askShare, /searchParams\.set\("ask"/);
  assert.match(askShare, /resultAnchor/);
  assert.match(askShare, /snapshot/);
  assert.match(app, /data-copy-ask/);
  assert.match(app, /WWAMSearchEngine\.create\([\s\S]{0,160}characterLore/);
  assert.doesNotMatch(app, /applyOwnerMappedCharacterKnowledge/);
  assert.match(search, /owner-mapped-character/);
  assert.match(search, /character-performance/);
  assert.match(app, /location\.search \+ "#" \+ targetId/);
  assert.match(app, /if \(location\.hash === "#pitch"\)/);
});

test("saved and exported evidence stays bounded and keeps its evidence type", () => {
  assert.match(app, /function normalizeEvidenceItem\(item\)/);
  assert.match(app, /function boundedExcerpt\(value\)/);
  assert.match(app, /\.map\(normalizeEvidenceItem\)/);
  assert.match(app, /excerpt: boundedExcerpt\(item\.excerpt\)/);
  assert.match(app, /evidenceLevel: item\.evidenceLevel/);
  assert.match(app, /evidenceType: item\.evidenceType/);
  assert.match(trivia, /excerptWordLimit: 16/);
  assert.match(trivia, /evidenceLevel: "TIMESTAMPED CAPTION RECEIPT"/);
  assert.match(trivia, /evidenceType: "caption-excerpt"/);
});

test("direct links wait for the advisory and short overlays remain operable", () => {
  assert.match(app, /function openInitialRoute\(\)/);
  assert.match(app, /if \(gate && !gate\.classList\.contains\("gone"\)\) return/);
  assert.match(app, /openInitialRoute\(\);/);
  assert.match(styles, /\.content-gate[\s\S]*overflow-y: auto/);
  assert.match(styles, /@media \(max-height: 620px\)/);
  assert.match(styles, /\.tour-shell[\s\S]*height: 100dvh/);
  assert.doesNotMatch(app, /THE EDIT QUEUE IS OFFLINE/);
  assert.match(app, /INDEXING THE EDIT QUEUE/);
});

test("browser capability failures degrade safely instead of breaking the demo", () => {
  assert.match(app, /function storageGet\(key\)[\s\S]*window\.localStorage\.getItem\(key\)[\s\S]*catch/);
  assert.match(app, /function storageSet\(key, value\)[\s\S]*window\.localStorage\.setItem\(key/);
  assert.match(app, /navigator\.clipboard\.writeText\(value\)[\s\S]*\.catch\(legacyCopy\)/);
  assert.match(app, /function legacyCopy\(\)[\s\S]*document\.execCommand\("copy"\)[\s\S]*window\.prompt/);
  assert.match(app, /previousFocus[\s\S]*previousFocus\.focus\(\)/);
  assert.match(app, /function saveEvidenceBag\(\) \{\s*return storageSet/);
  assert.match(app, /function saveCampaignIds\(\) \{\s*return storageSet/);
  assert.match(app, /THIS TAB ONLY/);
});

test("reduced profanity rerenders every surface that can expose archive text", () => {
  const setBand = app.slice(app.indexOf("function setBand("), app.indexOf("function renderTour("));
  [
    "renderHot100();",
    "renderSoundbytes();",
    "renderCharacter();",
    "renderMemory();",
    "renderLore();",
    "renderTrivia();",
    "renderControlRoom();",
    "renderClipLab();",
    "renderLabs();",
    "renderEvidenceBag();",
    "ask(state.lastAskQuery, state.lastAskAnalysis);",
  ].forEach((call) => assert.match(setBand, new RegExp(call.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))));
  assert.match(setBand, /refreshCharacterAnswerCopy\(\)/);
  assert.doesNotMatch(setBand, /state\.askContext = null/);
});

test("reduced mode masks source, derived, and user text without changing evidence state", () => {
  const languageSource = app.match(
    /function applyLanguageMode\(value\) \{[\s\S]*?function displayGeneratedText\(value\) \{[\s\S]*?\n  \}/
  );
  assert.ok(languageSource, "language-mode helpers could not be isolated");
  const displayUiText = Function(
    `var state = { redBand: false }; ${languageSource[0]}; return displayUiText;`
  )();
  const synthetic = "The Dick Prophecy was fucking wild, goddamn it—get off your ass.";
  const masked = displayUiText(synthetic);
  assert.doesNotMatch(masked, /\b(dick|fuck\w*|goddamn|ass)\b/i);

  assert.match(app, /displayUiText\(analysis\.answer\)/);
  assert.match(app, /displayUiText\(analysis\.entity\.toUpperCase\(\)\)/);
  assert.match(app, /displayUiText\([\s\S]{0,160}response\.subject\.toUpperCase\(\)/);
  assert.match(app, /displayUiText\(item\.label\)/);
  assert.match(app, /displayUiText\(reveal\.explanation\)/);
  assert.match(app, /displayUiText\(round\.prompt\)/);
  assert.match(app, /refreshSoundPlayerCopy\(\)/);
  assert.match(app, /refreshCharacterAnswerCopy\(\)/);
});

test("community timestamps reject overflow fields and whitespace-only targets", () => {
  const source = app.match(/function parseContributionTime\(value\) \{[\s\S]*?\n  \}\n\n  function saveHumanReviewSession/);
  assert.ok(source, "parseContributionTime could not be isolated");
  const functionSource = source[0].replace(/\n\n  function saveHumanReviewSession$/, "");
  const parseContributionTime = Function(`${functionSource}; return parseContributionTime;`)();

  assert.equal(parseContributionTime("90"), 90);
  assert.equal(parseContributionTime("1:30"), 90);
  assert.equal(parseContributionTime("1:02:03"), 3723);
  ["", "1:60", "1:75", "1:02:60", "1.5:02", "1:2:003", "-1"].forEach((value) => {
    assert.equal(Number.isNaN(parseContributionTime(value)), true, `${value} should be rejected`);
  });
  assert.match(app, /targetInput\.setCustomValidity\(targetId \? ""/);
  assert.match(app, /control\.oninput = function \(\) \{ control\.setCustomValidity\(""\); \}/);
});

test("the rotating hero pauses for focus, hover, hidden pages, and open dialogs", () => {
  assert.match(app, /document\.hidden \|\| !consoleNode/);
  assert.match(app, /consoleNode\.matches\(":hover"\)/);
  assert.match(app, /consoleNode\.contains\(document\.activeElement\)/);
  assert.match(app, /activeDialog\(\)/);
  assert.match(app, /if \(gate && !gate\.classList\.contains\("gone"\)\) return gate/);
});

test("the living archive exposes snapshot age instead of implying permanent freshness", () => {
  assert.match(app, /function archiveFreshness\(\)/);
  assert.match(app, /INDEX SNAPSHOT/);
  assert.match(app, /NEWEST SOURCE/);
  assert.match(app, /REFRESH DUE/);
  assert.match(styles, /\.freshness-ledger/);

  const source = app.match(/function archiveFreshness\(\) \{[\s\S]*?\n  \}\n\n  function franchiseSlug/);
  assert.ok(source, "archiveFreshness could not be isolated");
  const functionSource = source[0].replace(/\n\n  function franchiseSlug$/, "");
  const RealDate = Date;
  const fixedDate = (year, month, day, hour = 12) => {
    function FixedDate(...args) {
      return args.length
        ? new RealDate(...args)
        : new RealDate(year, month - 1, day, hour, 0, 0);
    }
    FixedDate.prototype = RealDate.prototype;
    return FixedDate;
  };
  const makeFreshness = (DateImpl) => Function(
    "deep",
    "live",
    "popular",
    "catalog",
    "Date",
    `${functionSource}; return archiveFreshness;`
  )(
    { generated: "2026-07-23" },
    { generated: "2026-07-23", streams: [{ date: "2026-07-23" }] },
    { generated: "2026-07-22", streams: [] },
    [],
    DateImpl
  );

  assert.equal(makeFreshness(fixedDate(2026, 7, 23, 23))().ageDays, 0);
  assert.equal(makeFreshness(fixedDate(2026, 7, 24, 1))().ageDays, 1);
});

test("automatic campaign normalization persists only when it changed and reports failure", () => {
  const renderCampaign = app.slice(
    app.indexOf("function renderCampaign("),
    app.indexOf("function toggleCampaign(")
  );
  assert.match(renderCampaign, /beforeNormalization/);
  assert.match(renderCampaign, /afterNormalization/);
  assert.match(renderCampaign, /beforeNormalization !== afterNormalization && !saveCampaignIds\(\)/);
  assert.match(renderCampaign, /CAMPAIGN CLEANUP KEPT FOR THIS TAB ONLY/);
});
