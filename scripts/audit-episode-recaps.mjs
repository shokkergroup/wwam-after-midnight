import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";
import { auditRecapVoiceDiversity } from "./audit-recap-voice-diversity.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const demo = path.join(root, "public", "demo");
const withoutArchiveCompletion = process.argv.includes(
  "--without-archive-completion",
);

const runtimeFiles = [
  "catalog.js",
  "deep-distill.js",
  "episode-guides.js",
  "episode-guide-v2-reviewed-release.js",
  "episode-guide-v2-newest-five-release.js",
  "episode-guide-v2-reviewed-merge.js",
  "livestream-distill.js",
  "popular-live-distill.js",
  "character-lore.js",
  "wwam-channel-dna.js",
  "showcase-engine.js",
  "creator-studio-engine.js",
  "archive-atlas-data.js",
  "archive-deep-distill.js",
  "archive-deep-batch2.js",
  "archive-deep-batch3.js",
  "archive-deep-batch4.js",
  "archive-deep-engine.js",
  "archive-deep-portfolio.js",
  "year-canon-2025-2026.js",
  "archive-recovery-batch1.js",
  "archive-recovery-batch2.js",
  "archive-completion.js",
  "title-topic-overrides.js",
  "episode-editorial-packs.js",
  "episode-editorial-packs-recent.js",
  "episode-editorial-packs-wave2.js",
  "episode-editorial-packs-wave3.js",
  "episode-editorial-packs-wave4.js",
  "episode-editorial-packs-wave5.js",
  "episode-editorial-packs-wave6.js",
  "episode-editorial-packs-wave7.js",
  "episode-editorial-packs-wave8.js",
  "episode-editorial-packs-wave9.js",
  "episode-editorial-packs-wave10.js",
  "episode-editorial-packs-wave11.js",
  "episode-editorial-packs-wave12.js",
  "episode-editorial-packs-wave13.js",
  "episode-editorial-packs-wave14.js",
  "episode-editorial-packs-wave15.js",
  "episode-editorial-packs-wave16.js",
  "episode-editorial-packs-wave17.js",
  "episode-editorial-packs-wave18.js",
  "episode-editorial-packs-wave19.js",
  "episode-editorial-packs-wave20.js",
  "episode-editorial-packs-wave21.js",
  "episode-editorial-packs-wave22.js",
  "episode-editorial-packs-wave23.js",
  "episode-editorial-packs-wave24.js",
  "episode-editorial-packs-wave25.js",
  "episode-editorial-packs-wave26.js",
  "episode-editorial-packs-wave27.js",
  "episode-editorial-packs-wave28.js",
  "episode-editorial-packs-wave29.js",
  "episode-editorial-packs-wave30.js",
  "episode-editorial-packs-wave31.js",
  "episode-editorial-packs-wave32.js",
  "episode-editorial-packs-wave33.js",
  "episode-editorial-packs-wave34.js",
  "episode-editorial-packs-wave35.js",
  "episode-editorial-packs-wave36.js",
  "episode-recap-engine.js",
  "wwam-episode-recap-adapter.js",
  "wwam-source-dossier-adapter.js",
].filter((file) => (
  file !== "archive-completion.js" ||
  !withoutArchiveCompletion && fs.existsSync(path.join(demo, file))
));

function compile() {
  const sandbox = { window: {} };
  sandbox.self = sandbox.window;
  vm.createContext(sandbox);
  runtimeFiles.forEach((file) => {
    vm.runInContext(fs.readFileSync(path.join(demo, file), "utf8"), sandbox, {
      filename: file,
    });
  });
  const runtime = sandbox.window;
  runtime.WWAM_EPISODE_GUIDES =
    runtime.WWAM_EPISODE_GUIDE_V2_REVIEWED_MERGE.mergeOrdered(
      runtime.WWAM_EPISODE_GUIDES,
      [
        runtime.WWAM_EPISODE_GUIDE_V2_REVIEWED_RELEASE,
        runtime.WWAM_EPISODE_GUIDE_V2_NEWEST_FIVE_RELEASE,
      ],
    );
  const showcase = runtime.WWAMShowcaseEngine.create({
    catalog: runtime.WWAM_CATALOG,
    deep: runtime.WWAM_DEEP_DISTILL,
    live: runtime.WWAM_LIVESTREAMS,
    popular: runtime.WWAM_POPULAR_LIVE,
    characters: runtime.WWAM_CHARACTER_LORE,
    dna: runtime.WWAM_CHANNEL_DNA,
  });
  const clipLab = runtime.WWAMCreatorClipLab.create({ showcase });
  const portfolio = runtime.WWAMArchiveDeepPortfolio.create(
    [
      runtime.WWAM_ARCHIVE_DEEP,
      runtime.WWAM_ARCHIVE_DEEP_BATCH2,
      runtime.WWAM_ARCHIVE_DEEP_BATCH3,
      runtime.WWAM_ARCHIVE_DEEP_BATCH4,
    ],
    runtime.WWAMArchiveDeepEngine,
  );
  const base = portfolio.getSearchPayload();
  const completion = runtime.WWAM_ARCHIVE_COMPLETION || {
    streams: [],
    topicIndex: [],
    characterIndex: [],
  };
  const archiveSearch = Object.assign({}, base, {
    streams: base.streams.concat(
      runtime.WWAM_YEAR_CANON_2025_2026.streams,
      runtime.WWAM_ARCHIVE_RECOVERY_BATCH1.streams,
      runtime.WWAM_ARCHIVE_RECOVERY_BATCH2.streams,
      completion.streams,
    ),
    topicIndex: base.topicIndex.concat(
      runtime.WWAM_YEAR_CANON_2025_2026.topicIndex,
      runtime.WWAM_ARCHIVE_RECOVERY_BATCH1.topicIndex,
      runtime.WWAM_ARCHIVE_RECOVERY_BATCH2.topicIndex,
      completion.topicIndex,
    ),
    characterIndex: base.characterIndex.concat(
      runtime.WWAM_YEAR_CANON_2025_2026.characterIndex,
      runtime.WWAM_ARCHIVE_RECOVERY_BATCH1.characterIndex,
      runtime.WWAM_ARCHIVE_RECOVERY_BATCH2.characterIndex,
      completion.characterIndex,
    ),
  });
  return runtime.WWAMSourceDossierAdapter.build({
    atlas: runtime.WWAM_ARCHIVE_ATLAS,
    catalog: runtime.WWAM_CATALOG,
    deep: runtime.WWAM_DEEP_DISTILL,
    episodeGuides: runtime.WWAM_EPISODE_GUIDES,
    live: runtime.WWAM_LIVESTREAMS,
    popular: runtime.WWAM_POPULAR_LIVE,
    archiveDeepPortfolio: { getSearchPayload: () => archiveSearch },
    showcase,
    clipLab,
    characters: runtime.WWAM_CHARACTER_LORE,
    dna: runtime.WWAM_CHANNEL_DNA,
    channel: {
      id: "wwam",
      label: "We Watched A Movie",
      product: "WWAM After Midnight",
      packFingerprint: "fnv1a32:recap-quality-audit",
    },
  });
}

function average(values) {
  return values.length
    ? Math.round(values.reduce((total, value) => total + value, 0) / values.length * 10) / 10
    : 0;
}

function countBy(values, getter) {
  return values.reduce((counts, value) => {
    const key = String(getter(value) || "NONE");
    counts[key] = (counts[key] || 0) + 1;
    return counts;
  }, {});
}

function words(value) {
  return new Set(
    String(value || "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, " ")
      .split(/\s+/)
      .filter((word) => word.length > 3),
  );
}

function overlap(left, right) {
  const a = words(left);
  const b = words(right);
  if (!a.size || !b.size) return 0;
  let shared = 0;
  a.forEach((word) => {
    if (b.has(word)) shared += 1;
  });
  return Math.round(shared / Math.min(a.size, b.size) * 100);
}

function prefix(value) {
  return String(value || "").split("//")[0].trim();
}

function prose(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function displaySubject(value) {
  return String(value || "")
    .replace(/^(?:TOPIC|CHARACTER PERFORMANCE|CHARACTER|MOMENT)\s*:\s*/i, "")
    .replace(/\s+/g, " ")
    .trim();
}

function storyReceiptKeys(segment) {
  const values = [
    ...(segment?.receiptKeys || []),
    ...(segment?.hiddenReceiptKeys || []),
    ...(segment?.timelineReceiptKeys || []),
    ...(segment?.hiddenTimelineReceiptKeys || []),
    ...(segment?.timelineReceipts || []).map((receipt) =>
      receipt?.receiptKey || receipt?.key
    ),
    ...(segment?.hiddenTimelineReceipts || []).map((receipt) =>
      receipt?.receiptKey || receipt?.key
    ),
  ];
  return Array.from(new Set(values.map(String).filter(Boolean)));
}

function hiddenStoryReceiptKeys(segment) {
  const visible = new Set((segment?.receiptKeys || []).map(String));
  return storyReceiptKeys(segment).filter((key) => !visible.has(key));
}

function wordCount(value) {
  return String(value || "").trim().split(/\s+/).filter(Boolean).length;
}

function topologyKey(value) {
  return displaySubject(value)
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function receiptKind(receipt) {
  const kind = String(receipt?.kind || "").toLowerCase();
  const evidenceType = String(receipt?.evidenceType || "").toLowerCase();
  if (kind.includes("topic") || evidenceType.includes("topic")) return "topic";
  if (kind.includes("character") || evidenceType.includes("character")) return "character";
  return "moment";
}

function minimumHighlightCount(duration) {
  const seconds = Number(duration || 0);
  if (seconds < 2700) return 5;
  if (seconds < 5400) return 8;
  if (seconds < 7200) return 10;
  if (seconds < 10800) return 12;
  return 15;
}

function isHumanEditorialFile(file) {
  const recap = file?.recap || {};
  return /human-editorial/i.test(String(recap.editorialState || "")) ||
    recap.editorialEvidence?.humanEditorialRead === true ||
    recap.caseFile?.humanEditorialRead === true;
}

function isStructuredSummaryFile(file) {
  return !isHumanEditorialFile(file) &&
    String(file?.recap?.editorialState || "") ===
      "structured-source-summary";
}

function publicModelFor(file) {
  if (isHumanEditorialFile(file)) return "human-editorial";
  if (isStructuredSummaryFile(file)) return "structured-source-summary";
  return "legacy";
}

function textPresent(value) {
  return Boolean(String(value || "").trim());
}

function validWindow(item, duration, requireEnd = true) {
  const at = Number(item?.at);
  const end = Number(item?.end);
  return Number.isFinite(at) &&
    at >= 0 &&
    at <= duration &&
    (!requireEnd || (
      Number.isFinite(end) &&
      end > at &&
      end <= duration + 1
    ));
}

function comparableExcerpt(value) {
  return String(value || "")
    .replace(/^[\s.\u2026\u00e2\u20ac\u00a6]+|[\s.\u2026\u00e2\u20ac\u00a6]+$/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function guidePointAt(point) {
  const value = point?.at ?? point?.t;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.max(0, parsed) : null;
}

function guidePoints(file) {
  const guide = file.source.showWiki?.episodeGuide || {};
  const chapters = Array.isArray(guide.chapters) ? guide.chapters : [];
  const chapterByCutId = new Map(
    chapters
      .filter((chapter) => String(chapter?.cutId || "").trim())
      .map((chapter) => [String(chapter.cutId).trim(), chapter]),
  );
  const points = [];
  const seen = new Set();
  const add = (point, index, chapterFallback = false) => {
    const at = guidePointAt(point);
    if (at === null) return;
    const id = String(
      chapterFallback
        ? point?.cutId || point?.id || ""
        : point?.id || point?.cutId || "",
    ).trim() || `guide-point-${index + 1}-${Math.round(at)}`;
    if (seen.has(id)) return;
    const chapter = chapterByCutId.get(id) || {};
    const topic = String(point?.topic || chapter.topic || "").trim();
    const category = String(
      point?.category || chapter.category || point?.label || "",
    ).trim();
    if (!topic && !category) return;
    seen.add(id);
    points.push({
      id,
      at,
      end: Number(point?.end || chapter.end || at + 36),
      topic,
      category,
      excerpt: String(point?.excerpt || chapter.excerpt || "").trim(),
      chapterId: String(chapter.id || (chapterFallback ? point?.id : "") || "").trim(),
    });
  };
  (guide.cuts || []).forEach((point, index) => add(point, index, false));
  chapters.forEach((point, index) => {
    add(point, (guide.cuts || []).length + index, true);
  });
  return points.sort((left, right) => left.at - right.at || left.id.localeCompare(right.id));
}

const evidenceStopWords = new Set([
  "a", "an", "and", "are", "at", "for", "from", "in", "is", "live",
  "movie", "of", "on", "or", "party", "show", "stream", "the", "to",
  "vs", "watch", "watchalong", "watched", "we", "with",
]);

function evidenceWords(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 1 && !evidenceStopWords.has(word));
}

function normalizedEvidenceText(values) {
  return (Array.isArray(values) ? values : [values])
    .map((value) => String(value || "")
      .toLowerCase()
      .replace(/&/g, " and ")
      .replace(/[^a-z0-9]+/g, " ")
      .replace(/\s+/g, " ")
      .trim())
    .filter(Boolean)
    .join(" ");
}

function humanizeEntityId(value) {
  return String(value || "")
    .replace(/^[^:]+:/, "")
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
    .trim();
}

function evidenceLabels(evidence) {
  return [
    evidence?.topic,
    evidence?.label,
    evidence?.category,
    ...(evidence?.entityIds || []).map(humanizeEntityId),
  ].filter(Boolean);
}

function evidenceSupportsSubject(subject, evidence) {
  const exact = normalizedEvidenceText(subject);
  const haystack = normalizedEvidenceText([
    ...evidenceLabels(evidence),
    evidence?.excerpt,
  ]);
  if (!exact || !haystack) return false;
  if (` ${haystack} `.includes(` ${exact} `)) return true;
  const haystackWords = new Set(haystack.split(/\s+/));
  return evidenceWords(subject).some(
    (word) => word.length >= 3 && haystackWords.has(word),
  );
}

function receiptSignal(receipt) {
  const signal = Number(receipt?.signalScore || receipt?.heat || 0);
  return Number.isFinite(signal) ? signal : 0;
}

function strongestReceipts(receipts, limit) {
  return receipts.slice().sort((left, right) =>
    receiptSignal(right) - receiptSignal(left) ||
    Number(left?.at || left?.t || 0) - Number(right?.at || right?.t || 0) ||
    String(left?.key || "").localeCompare(String(right?.key || ""))
  ).slice(0, limit);
}

function recapText(file) {
  const parts = [
    file.recap.headline,
    file.recap.deck,
    file.recap.overview,
    ...(file.recap.highlightRunway || []).flatMap((moment) => [
      moment.category,
      moment.label,
      moment.excerpt,
    ]),
    ...Object.values(file.recap.fanRead || {}).flatMap((item) => [
      item.label,
      item.topic,
      item.body,
      item.excerpt,
    ]),
  ];
  if (!isStructuredSummaryFile(file)) {
    parts.push(...file.recap.story.flatMap(
      (segment) => [segment.label, segment.body],
    ));
  }
  if (publicModelFor(file) === "legacy") {
    parts.push(...file.recap.sections.flatMap(
      (section) => [section.label, section.body],
    ));
  }
  if (isHumanEditorialFile(file)) {
    parts.push(...(file.recap.editorialPanels || []).flatMap((panel) => [
      panel.eyebrow,
      panel.title,
      panel.intro,
      panel.note,
      ...(panel.groups || []).flatMap((group) => [
        group.label,
        ...(group.items || []),
      ]),
      ...(panel.items || []).flatMap((item) => [
        item.subject,
        item.verdict,
        item.character,
        item.label,
      ]),
    ]));
  }
  return parts.join(" ");
}

function generatedRecapCopyEntries(file) {
  const entry = (location, text, characterLabels = []) => ({
    sourceId: file.id,
    location,
    text: String(text || ""),
    characterLabels: Array.from(
      new Set((characterLabels || []).map(displaySubject).filter(Boolean)),
    ),
  });
  const entries = [
    entry("headline", file.recap.headline),
    entry("deck", file.recap.deck),
    entry("overview", file.recap.overview),
  ];
  if (!isStructuredSummaryFile(file)) {
    entries.push(...file.recap.story.flatMap((segment, index) => {
      const location = `story:${segment.id || index + 1}`;
      return [
        entry(`${location}:label`, segment.label, segment.characterLabels),
        entry(`${location}:body`, segment.body, segment.characterLabels),
      ];
    }));
  }
  if (publicModelFor(file) === "legacy") {
    entries.push(...file.recap.sections.flatMap((section, index) => {
      const location = `section:${section.id || index + 1}`;
      return [
        entry(`${location}:label`, section.label, section.characterLabels),
        entry(`${location}:body`, section.body, section.characterLabels),
      ];
    }));
  }
  return entries.filter((item) => item.text.trim());
}

function numericArticleFailures(text) {
  const failures = [];
  const pattern = /\b(a|an)\s+(\d+)(?=\b|-)/gi;
  for (const match of String(text || "").matchAll(pattern)) {
    const article = match[1].toLowerCase();
    const number = match[2];
    const takesAn = /^(?:8\d*|11$|18$)/.test(number);
    if (takesAn && article === "a") {
      failures.push(`numeric article should be "an" before ${number}`);
    } else if (!takesAn && article === "an") {
      failures.push(`numeric article should be "a" before ${number}`);
    }
  }
  return failures;
}

function hasDuplicatePairedTimestamp(text) {
  const value = String(text || "");
  const timestamps = Array.from(
    value.matchAll(/\b(?:\d{1,2}:)?\d{1,2}:\d{2}\b/g),
  );
  return timestamps.some((timestamp, index) => {
    const next = timestamps[index + 1];
    if (!next || timestamp[0] !== next[0]) return false;
    const between = value.slice(
      Number(timestamp.index) + timestamp[0].length,
      Number(next.index),
    );
    return between.length <= 32 &&
      /^\s*(?:(?:and|or|to|through)\b|[,&/+|:;•·–—-])+\s*$/i.test(between);
  });
}

function generatedCopyGrammarFailures(file) {
  return generatedRecapCopyEntries(file).flatMap((item) => {
    const failures = [];
    if (/\bthe\s+the\b/i.test(item.text)) {
      failures.push("doubled definite article");
    }
    failures.push(...numericArticleFailures(item.text));
    if (hasDuplicatePairedTimestamp(item.text)) {
      failures.push("duplicate paired timestamp");
    }
    if (
      item.characterLabels.length === 1 &&
      /\b(?:turn up|enter the mix)\b/i.test(item.text)
    ) {
      failures.push("single-character plural verb");
    }
    if (/\bsaved reaction\b/i.test(item.text)) {
      failures.push("fallback subject leaked into fan copy");
    }
    if (
      item.location === "headline" &&
      /^\s*THE\s+(?:A|AN)\b/i.test(item.text)
    ) {
      failures.push("stacked headline article");
    }
    return failures.map((failure) => ({
      sourceId: item.sourceId,
      location: item.location,
      failure,
      text: item.text,
    }));
  });
}

function auditHumanEditorialFile(file) {
  const failures = [];
  const recap = file.recap || {};
  const duration = Math.max(1, Number(file.source?.duration || 0));
  const evidence = recap.editorialEvidence || {};
  const story = Array.isArray(recap.story) ? recap.story : [];
  const highlights = Array.isArray(recap.highlightRunway)
    ? recap.highlightRunway
    : [];
  const panels = Array.isArray(recap.editorialPanels)
    ? recap.editorialPanels
    : [];
  const fanRead = recap.fanRead || {};
  const add = (location, failure) => failures.push({ location, failure });

  if (recap.editorialState !== "full-tape-human-editorial-read") {
    add("editorialState", "missing full-tape human editorial review state");
  }
  if (
    !Number.isFinite(Number(evidence.duration)) ||
    Math.abs(Number(evidence.duration) - duration) > 2
  ) {
    add("editorialEvidence.duration", "declared duration does not match source");
  }
  if (!(Number(evidence.captionWords) > 0)) {
    add("editorialEvidence.captionWords", "caption word count is missing");
  }
  if (!/^sha256:[a-f0-9]{64}$/i.test(String(evidence.captionSha256 || ""))) {
    add("editorialEvidence.captionSha256", "caption digest is missing or malformed");
  }
  if (evidence.speakerAttribution !== false) {
    add(
      "editorialEvidence.speakerAttribution",
      "speaker attribution must remain explicitly disabled",
    );
  }
  if (recap.caseFile?.humanEditorialRead !== true) {
    add("caseFile.humanEditorialRead", "public recap lost its human-read marker");
  }
  if (recap.approval?.actualApproval !== false) {
    add("approval.actualApproval", "independent archive must not imply approval");
  }
  if (
    !textPresent(recap.headline) ||
    !textPresent(recap.deck) ||
    !textPresent(recap.overview)
  ) {
    add("publicSummary", "headline, deck, and overview must all be authored");
  }

  const minimumStoryCount = Math.max(3, Math.ceil(duration / 1800));
  if (story.length < minimumStoryCount) {
    add(
      "story",
      `full-tape story has ${story.length}; expected at least ${minimumStoryCount}`,
    );
  }
  const storyIds = new Set();
  story.forEach((item, index) => {
    const location = `story[${index}]`;
    if (!textPresent(item.id) || storyIds.has(String(item.id))) {
      add(`${location}.id`, "story id is missing or duplicated");
    }
    storyIds.add(String(item.id || ""));
    if (!textPresent(item.label) || !textPresent(item.body)) {
      add(location, "story label and authored body are required");
    }
    const words = wordCount(item.body);
    if (words < 12 || words > 90) {
      add(`${location}.body`, `human story body is ${words} words; expected 12-90`);
    }
    if (!validWindow(item, duration)) {
      add(location, "story window falls outside the exact source");
    }
    if (
      index &&
      (
        Number(item.at) < Number(story[index - 1].at) ||
        Number(item.at) < Number(story[index - 1].end)
      )
    ) {
      add(location, "story must remain chronological and non-overlapping");
    }
  });
  if (
    story.length &&
    (
      Number(story[0].at) / duration > 0.05 ||
      Number(story.at(-1).end) / duration < 0.95
    )
  ) {
    add("story", "full-tape story must cover the opening and closing source windows");
  }

  const highlightFloor = minimumHighlightCount(duration);
  if (highlights.length < highlightFloor) {
    add(
      "highlightRunway",
      `human highlight runway has ${highlights.length}; expected at least ${highlightFloor}`,
    );
  }
  const highlightIdentities = new Set();
  highlights.forEach((item, index) => {
    const location = `highlightRunway[${index}]`;
    if (
      !textPresent(item.category) ||
      !textPresent(item.label) ||
      !textPresent(item.excerpt)
    ) {
      add(location, "highlight category, label, and bounded excerpt are required");
    }
    if (!validWindow(item, duration)) {
      add(location, "highlight window falls outside the exact source");
    }
    if (index && Number(item.at) < Number(highlights[index - 1].at)) {
      add(location, "highlight runway is not chronological");
    }
    const identity = `${Number(item.at)}|${Number(item.end)}|${item.label}`;
    if (highlightIdentities.has(identity)) {
      add(location, "duplicate human highlight");
    }
    highlightIdentities.add(identity);
  });

  const expectedFanLanes = ["loved", "hated", "wildestDetour", "lastWord"];
  expectedFanLanes.forEach((lane) => {
    const item = fanRead[lane];
    const location = `fanRead.${lane}`;
    if (
      !item ||
      !textPresent(item.label) ||
      !textPresent(item.topic) ||
      !textPresent(item.body)
    ) {
      add(location, "human fan lane is missing public editorial copy");
      return;
    }
    if (!validWindow(item, duration)) {
      add(location, "human fan-lane window falls outside the exact source");
    }
  });

  const panelIds = new Set();
  panels.forEach((panel, panelIndex) => {
    const location = `editorialPanels[${panelIndex}]`;
    const type = String(panel?.type || "");
    if (
      !textPresent(panel?.id) ||
      panelIds.has(String(panel.id)) ||
      !/^(?:ranking|verdict|character)-ledger$/.test(type)
    ) {
      add(location, "panel id is missing/duplicated or panel type is unsupported");
    }
    panelIds.add(String(panel?.id || ""));
    if (
      !textPresent(panel?.title) ||
      !textPresent(panel?.intro) && !textPresent(panel?.note)
    ) {
      add(
        location,
        "panel needs a title plus an editorial introduction or evidence note",
      );
    }
    const groups = Array.isArray(panel?.groups) ? panel.groups : [];
    const items = Array.isArray(panel?.items) ? panel.items : [];
    groups.forEach((group, groupIndex) => {
      if (
        !textPresent(group?.label) ||
        !Array.isArray(group?.items) ||
        !group.items.length ||
        group.items.some((item) => !textPresent(item))
      ) {
        add(
          `${location}.groups[${groupIndex}]`,
          "ranking group needs a label and non-empty public items",
        );
      }
    });
    items.forEach((item, itemIndex) => {
      const itemLocation = `${location}.items[${itemIndex}]`;
      if (type === "character-ledger") {
        if (!textPresent(item?.character) || !textPresent(item?.label)) {
          add(itemLocation, "character receipt needs a character and clip label");
        }
        if (!validWindow(item, duration)) {
          add(itemLocation, "character receipt needs an exact playable window");
        }
      } else if (
        !textPresent(item?.subject) ||
        !textPresent(item?.verdict)
      ) {
        add(itemLocation, "verdict receipt needs a subject and authored verdict");
      } else if (
        (item.at != null || item.end != null) &&
        !validWindow(item, duration)
      ) {
        add(itemLocation, "verdict receipt window falls outside the exact source");
      }
    });
    if (
      type === "ranking-ledger" && !groups.length ||
      type === "verdict-ledger" && !groups.length && !items.length ||
      type === "character-ledger" && !items.length
    ) {
      add(location, "editorial panel has no public ledger entries");
    }
  });

  return failures.length ? [{
    sourceId: file.id,
    failures,
    storyCount: story.length,
    highlightCount: highlights.length,
    panelCount: panels.length,
  }] : [];
}

function auditStructuredSummaryFile(file) {
  const failures = [];
  const recap = file.recap || {};
  const duration = Math.max(1, Number(file.source?.duration || 0));
  const receipts = new Set(
    (file.source?.receipts || []).map((item) => String(item?.key || ""))
      .filter(Boolean),
  );
  const guideCuts = new Set(
    (file.source?.showWiki?.episodeGuide?.cuts || [])
      .map((item) => String(item?.id || "")).filter(Boolean),
  );
  const highlights = Array.isArray(recap.highlightRunway)
    ? recap.highlightRunway
    : [];
  const add = (location, failure) => failures.push({ location, failure });

  if (!textPresent(recap.headline) || !textPresent(recap.overview)) {
    add("publicSummary", "public headline and overview are required");
  }
  if (!highlights.length) {
    add("highlightRunway", "public structured summary needs a playable runway");
  }
  const identities = new Set();
  highlights.forEach((item, index) => {
    const location = `highlightRunway[${index}]`;
    const receiptKey = String(item?.receiptKey || "");
    const guideCutId = String(item?.guideCutId || "");
    const sourceBound = receiptKey
      ? receipts.has(receiptKey)
      : guideCutId
        ? guideCuts.has(guideCutId)
        : false;
    if (!sourceBound) {
      add(location, "public highlight is not bound to this exact source");
    }
    if (!textPresent(item?.label) || !textPresent(item?.category)) {
      add(location, "public highlight label and category are required");
    }
    if (!validWindow(item, duration)) {
      add(location, "public highlight window falls outside the exact source");
    }
    if (index && Number(item.at) < Number(highlights[index - 1].at)) {
      add(location, "public highlight runway is not chronological");
    }
    const identity = `${receiptKey}|${guideCutId}`;
    if (identities.has(identity)) {
      add(location, "duplicate public highlight identity");
    }
    identities.add(identity);
  });

  Object.entries(recap.fanRead || {}).forEach(([lane, item]) => {
    if (!textPresent(item?.body)) return;
    const location = `fanRead.${lane}`;
    const sourceBound = item.receiptKey
      ? receipts.has(String(item.receiptKey))
      : item.guideCutId
        ? guideCuts.has(String(item.guideCutId))
        : false;
    if (
      !textPresent(item.label) ||
      !textPresent(item.topic) ||
      !sourceBound ||
      !validWindow(item, duration)
    ) {
      add(
        location,
        "public fan lane must have copy, a source identity, and a valid window",
      );
    }
  });

  return failures.length ? [{
    sourceId: file.id,
    failures,
    highlightCount: highlights.length,
  }] : [];
}

if (process.argv.includes("--copy-grammar-negative-fixture")) {
  const failures = generatedCopyGrammarFailures({
    id: "__copy-grammar-negative-fixture__",
    recap: {
      headline: "THE AN ARCHIVE PROBLEM",
      deck: "A 11 min route through the tape.",
      overview: "The show reaches the The final chapter.",
      story: [{
        id: "fixture-story",
        label: "SAVED REACTION",
        body: "Dr. Loomis turn up at 1:23 and 1:23.",
        characterLabels: ["Dr. Loomis"],
      }],
      sections: [],
    },
  });
  process.stdout.write(`${JSON.stringify({
    pass: failures.length === 0,
    failures,
  }, null, 2)}\n`);
  process.exit(process.argv.includes("--check") && failures.length ? 1 : 0);
}

const result = compile();
const files = result.sources.map((source) => ({
  id: source.id,
  title: source.displayTitle || source.title,
  coverage: source.coverage,
  source,
  recap: source.showWiki.episodeRecap,
  legacyRecap: source.showWiki.recap,
})).map((file) => ({
  ...file,
  publicModel: publicModelFor(file),
}));
const ready = files.filter((file) => file.recap.state === "ready");
const held = files.filter((file) => file.recap.state === "held");
const humanEditorialReady = ready.filter(isHumanEditorialFile);
const structuredSummaryReady = ready.filter(isStructuredSummaryFile);
const legacyReady = ready.filter((file) => file.publicModel === "legacy");
const publicStoryFiles = humanEditorialReady.concat(legacyReady);
const sections = legacyReady.flatMap((file) =>
  file.recap.sections.map((section) => ({ sourceId: file.id, ...section })),
);
const storySegments = publicStoryFiles.flatMap((file) =>
  file.recap.story.map((segment) => ({
    sourceId: file.id,
    publicModel: file.publicModel,
    ...segment,
  })),
);
const legacyStorySegments = storySegments.filter(
  (segment) => segment.publicModel === "legacy",
);
const humanStorySegments = storySegments.filter(
  (segment) => segment.publicModel === "human-editorial",
);
const humanEditorialTruthFailures = humanEditorialReady.flatMap(
  auditHumanEditorialFile,
);
const structuredPublicSummaryFailures = structuredSummaryReady.flatMap(
  auditStructuredSummaryFile,
);
const actEvidence = legacyReady.map((file) => {
  const registered = file.source.receipts || [];
  const usedKeys = new Set(file.recap.sections.flatMap((section) => section.receiptKeys));
  const registeredByKind = {
    topic: registered.filter((receipt) => receiptKind(receipt) === "topic"),
    moment: registered.filter((receipt) => receiptKind(receipt) === "moment"),
    character: registered.filter((receipt) => receiptKind(receipt) === "character"),
  };
  const usedByKind = Object.fromEntries(
    Object.entries(registeredByKind).map(([kind, values]) => [
      kind,
      values.filter((receipt) => usedKeys.has(receipt.key)),
    ]),
  );
  return {
    sourceId: file.id,
    registered: registered.length,
    used: registered.filter((receipt) => usedKeys.has(receipt.key)).length,
    registeredByKind,
    usedByKind,
    openingCategory: file.recap.sections[0]?.category || "",
  };
});
const actEvidenceTotals = actEvidence.reduce((totals, item) => {
  totals.registered += item.registered;
  totals.used += item.used;
  for (const kind of ["topic", "moment", "character"]) {
    totals.registeredByKind[kind] += item.registeredByKind[kind].length;
    totals.usedByKind[kind] += item.usedByKind[kind].length;
  }
  totals.openings[item.openingCategory] =
    (totals.openings[item.openingCategory] || 0) + 1;
  return totals;
}, {
  registered: 0,
  used: 0,
  registeredByKind: { topic: 0, moment: 0, character: 0 },
  usedByKind: { topic: 0, moment: 0, character: 0 },
  openings: {},
});
const storyCoverageFailures = legacyReady.flatMap((file) => {
  const registeredKeys = file.source.receipts.map((receipt) =>
    String(receipt.key || "")
  ).filter(Boolean);
  const registered = new Set(registeredKeys);
  const narratedKeys = file.recap.story.flatMap(storyReceiptKeys);
  const narrated = new Set(narratedKeys);
  const hidden = new Set(
    file.recap.story.flatMap(hiddenStoryReceiptKeys),
  );
  const missing = Array.from(registered).filter((key) => !narrated.has(key));
  const foreign = Array.from(narrated).filter((key) => !registered.has(key));
  const duplicateRegistered =
    registeredKeys.length - registered.size;
  const duplicateStoryOwnership =
    narratedKeys.length - narrated.size;
  const hiddenTimelineRegistered = registeredKeys.filter((key) =>
    /:timeline:/i.test(key)
  );
  const hiddenTimelineMissing = hiddenTimelineRegistered.filter((key) =>
    !narrated.has(key)
  );
  const reportedHidden = Number(
    file.recap.caseFile.storyHiddenReceiptCount ??
      file.recap.caseFile.hiddenTimelineReceiptCount ??
      hidden.size,
  );
  return missing.length || foreign.length ||
      duplicateRegistered || duplicateStoryOwnership ||
      hiddenTimelineMissing.length ||
      file.recap.caseFile.storyReceiptCount !== registered.size ||
      file.recap.caseFile.storyCoveragePercent !== 100 ||
      reportedHidden !== hidden.size
    ? [{
      sourceId: file.id,
      registered: registered.size,
      narrated: narrated.size,
      hidden: hidden.size,
      missing,
      foreign,
      duplicateRegistered,
      duplicateStoryOwnership,
      hiddenTimelineRegistered: hiddenTimelineRegistered.length,
      hiddenTimelineMissing,
      reportedCoverage: file.recap.caseFile.storyCoveragePercent,
      reportedHidden,
    }]
    : [];
});
const storyAnchorFailures = legacyReady.flatMap((file) => {
  const receiptByKey = new Map(
    file.source.receipts.map((receipt) => [receipt.key, receipt]),
  );
  return file.recap.story.flatMap((segment, index, values) => {
    const anchor = receiptByKey.get(segment.anchorReceiptKey);
    const excerpt = comparableExcerpt(segment.excerpt);
    const ownedExcerpt = !excerpt || (
      anchor?.publicExcerptAllowed &&
      comparableExcerpt(anchor.excerpt).startsWith(excerpt)
    );
    const runtimeWindow =
      Number(segment.at) >= 0 &&
      Number(segment.end) > Number(segment.at) &&
      Number(segment.end) <= Number(file.source.duration) + 1 &&
      Number(segment.anchorAt) >= Number(segment.at) &&
      Number(segment.anchorAt) <= Number(segment.end) &&
      (
        index === 0 ||
        Number(segment.at) >= Number(values[index - 1].at)
      );
    return anchor &&
        storyReceiptKeys(segment).includes(segment.anchorReceiptKey) &&
        Number(anchor.at) === Number(segment.anchorAt) &&
        ownedExcerpt &&
        runtimeWindow
      ? []
      : [{
        sourceId: file.id,
        segmentId: segment.id,
        anchorReceiptKey: segment.anchorReceiptKey,
        anchorAt: segment.anchorAt,
        receiptAt: anchor?.at ?? null,
        ownedExcerpt,
        runtimeWindow,
        at: segment.at,
        end: segment.end,
      }];
  });
});
const namelessStorySegments = legacyReady.flatMap((file) =>
  file.recap.story.flatMap((segment) => {
    const primary = String(segment.narrative?.primarySubject || "").trim();
    return !primary ||
        /without a named subject attached/i.test(segment.body || "")
      ? [{
        sourceId: file.id,
        segmentId: segment.id,
        primarySubject: primary,
        body: segment.body,
      }]
      : [];
  }),
);
const inventoryStorySegments = legacyReady.flatMap((file) =>
  file.recap.story.flatMap((segment) =>
    /\bmoves through\b|without a named subject attached/i.test(segment.body || "")
      ? [{
        sourceId: file.id,
        segmentId: segment.id,
        body: segment.body,
      }]
      : []
  ),
);
const storyNarrativeBeatFailures = legacyReady.flatMap((file) => {
  const receiptByKey = new Map(
    file.source.receipts.map((receipt) => [receipt.key, receipt]),
  );
  const guideById = new Map(
    guidePoints(file).map((point) => [point.id, point]),
  );
  return file.recap.story.flatMap((segment, index, values) => {
    const narrative = segment.narrative || {};
    const primary = narrative.primaryEvidence || {};
    const expectedPrevious = index
      ? String(values[index - 1].narrative?.primarySubject || "")
      : "";
    const expectedNext = index + 1 < values.length
      ? String(values[index + 1].narrative?.primarySubject || "")
      : "";
    let evidenceOwned = false;
    if (primary.kind === "guide-cut") {
      const guidePoint = guideById.get(primary.key);
      evidenceOwned = Boolean(
        guidePoint &&
        (segment.guideCutIds || []).includes(primary.key) &&
        Number(primary.at) === Number(guidePoint.at),
      );
    } else if (primary.kind === "receipt") {
      const receipt = receiptByKey.get(primary.key);
      evidenceOwned = Boolean(
        receipt &&
        storyReceiptKeys(segment).includes(primary.key) &&
        Number(primary.at) === Number(receipt.at),
      );
    }
    const shape = narrative.evidenceShape || {};
    const shapeOwned =
      Number(shape.receipts) === storyReceiptKeys(segment).length &&
      Number(shape.guideCuts) === (segment.guideCutIds || []).length &&
      Number(shape.namedSubjects) >= 1;
    const transitionOwned =
      String(narrative.previousSubject || "") === expectedPrevious &&
      String(narrative.nextSubject || "") === expectedNext;
    return narrative.schema === "shokker-recap-narrative-beat/v1" &&
        String(narrative.primarySubject || "").trim() &&
        evidenceOwned &&
        shapeOwned &&
        transitionOwned
      ? []
      : [{
        sourceId: file.id,
        segmentId: segment.id,
        schema: narrative.schema || "",
        primarySubject: narrative.primarySubject || "",
        primaryEvidence: primary,
        evidenceOwned,
        shapeOwned,
        transitionOwned,
      }];
  });
});
const storySemanticAnchorFailures = legacyReady.flatMap((file) => {
  const receiptByKey = new Map(
    file.source.receipts.map((receipt) => [receipt.key, receipt]),
  );
  const guideById = new Map(
    guidePoints(file).map((point) => [point.id, point]),
  );
  return file.recap.story.flatMap((segment) => {
    const narrative = segment.narrative || {};
    const primary = String(narrative.primarySubject || "").trim();
    const primaryEvidence = narrative.primaryEvidence || {};
    const guideIds = segment.guideCutIds || [];
    const isGuideBacked = guideIds.length > 0;
    const evidence = primaryEvidence.kind === "guide-cut"
      ? guideById.get(primaryEvidence.key)
      : receiptByKey.get(primaryEvidence.key);
    const evidenceOwned = primaryEvidence.kind === "guide-cut"
      ? Boolean(evidence && guideIds.includes(primaryEvidence.key))
      : Boolean(
        evidence && storyReceiptKeys(segment).includes(primaryEvidence.key),
      );
    const expectedSupport = evidenceSupportsSubject(primary, evidence);
    const recordedSupport = narrative.anchorSupportsPrimary;
    const relationBoolean =
      typeof recordedSupport === "boolean" &&
      (!recordedSupport || expectedSupport);
    const relationLabel = recordedSupport
      ? "direct-subject-anchor"
      : "separate-saved-spike";
    const relationOwned = narrative.anchorRelation === relationLabel;
    const anchorSubject = String(narrative.anchorSubject || "").trim();
    const anchorSubjectOwned =
      Boolean(anchorSubject) &&
      evidenceSupportsSubject(anchorSubject, evidence);
    const localReceiptCandidates = storyReceiptKeys(segment)
      .map((key) => receiptByKey.get(key))
      .filter(Boolean)
      .filter((receipt) => evidenceSupportsSubject(primary, receipt));
    const guideRule = !isGuideBacked || (
      primaryEvidence.kind === "guide-cut" &&
      guideIds.includes(primaryEvidence.key) &&
      (!recordedSupport || expectedSupport)
    );
    const receiptRule = isGuideBacked || (
      primaryEvidence.kind === "receipt" &&
      (
        recordedSupport
          ? localReceiptCandidates.length > 0 && expectedSupport
          : true
      )
    );
    return primary &&
        evidenceOwned &&
        relationBoolean &&
        relationOwned &&
        anchorSubjectOwned &&
        guideRule &&
        receiptRule
      ? []
      : [{
        sourceId: file.id,
        segmentId: segment.id,
        primarySubject: primary,
        primaryEvidence,
        evidenceOwned,
        expectedSupport,
        recordedSupport,
        anchorSubject,
        anchorSubjectOwned,
        relation: narrative.anchorRelation || "",
        expectedRelation: relationLabel,
        isGuideBacked,
        localReceiptCandidateCount: localReceiptCandidates.length,
        guideRule,
        receiptRule,
      }];
  });
});
const bestMomentSelectionFailures = legacyReady.flatMap((file) => {
  const momentReceipts = file.source.receipts.filter(
    (receipt) => receiptKind(receipt) === "moment",
  );
  const strongest = strongestReceipts(momentReceipts, 1).map(
    (receipt) => String(receipt.key || ""),
  );
  const actual = file.recap.bestMoments.map(
    (moment) => String(moment.receiptKey || ""),
  );
  const registered = new Set(momentReceipts.map(
    (receipt) => String(receipt.key || ""),
  ));
  const expectedCount = Math.min(5, momentReceipts.length);
  const mirrorsFullMomentSet =
    momentReceipts.length > 5 &&
    actual.length === momentReceipts.length;
  const selective = actual.length === expectedCount && !mirrorsFullMomentSet;
  const sourceBound = actual.every((key) => registered.has(key));
  const uniqueSelection = new Set(actual).size === actual.length;
  const strongestLeads = !strongest.length || actual[0] === strongest[0];
  return selective && sourceBound && uniqueSelection && strongestLeads
    ? []
    : [{
      sourceId: file.id,
      registeredMomentReceipts: momentReceipts.length,
      strongest,
      expectedCount,
      actual,
      mirrorsFullMomentSet,
      selective,
      sourceBound,
      uniqueSelection,
      strongestLeads,
    }];
});
const highlightRunwayAudits = legacyReady.map((file) => {
  const registered = Array.isArray(file.source.receipts)
    ? file.source.receipts
    : [];
  const guide = file.source.showWiki?.episodeGuide || {};
  const guideCuts = Array.isArray(guide.cuts) ? guide.cuts : [];
  const registeredByKey = new Map(registered.map((receipt) => [
    String(receipt.key || ""),
    receipt,
  ]));
  const guideCutById = new Map(guideCuts.map((cut) => [
    String(cut.id || ""),
    cut,
  ]));
  const requiredKeys = registered
    .filter((receipt) => receiptKind(receipt) !== "topic")
    .map((receipt) => String(receipt.key || ""))
    .filter(Boolean);
  const runway = Array.isArray(file.recap.highlightRunway)
    ? file.recap.highlightRunway
    : [];
  const actualKeys = runway.map((moment) => {
    const receiptKey = String(moment.receiptKey || "");
    const guideCutId = String(moment.guideCutId || "");
    return receiptKey ? `receipt:${receiptKey}` :
      guideCutId ? `guide:${guideCutId}` : "";
  }).filter(Boolean);
  const uniqueKeys = new Set(actualKeys);
  const expectedFloor = requiredKeys.length || guideCuts.length
    ? Math.min(
      minimumHighlightCount(file.source.duration),
      registered.length + guideCuts.length,
    )
    : 0;
  const missingRequired = requiredKeys.filter(
    (key) => !uniqueKeys.has(`receipt:${key}`),
  );
  const foreignKeys = runway.filter((moment) => {
    const receiptKey = String(moment.receiptKey || "");
    const guideCutId = String(moment.guideCutId || "");
    return receiptKey
      ? !registeredByKey.has(receiptKey)
      : guideCutId
        ? !guideCutById.has(guideCutId)
        : true;
  }).map((moment) => String(
    moment.receiptKey || moment.guideCutId || "MISSING_KEY",
  ));
  const chronological = runway.every((moment, index) =>
    index === 0 ||
    Number(runway[index - 1].at || 0) <= Number(moment.at || 0)
  );
  const categoriesComplete = runway.every((moment) =>
    String(moment.category || "").trim()
  );
  const strictSteveKeys = new Set(
    (file.source.showWiki?.lanes || [])
      .filter((lane) =>
        /straight[- ]to[- ]steve|steve'?s?\s+asshole/i.test(
          `${lane.id || ""} ${lane.label || ""}`,
        )
      )
      .flatMap((lane) => lane.receiptKeys || []),
  );
  const reviewedSteveCutId = String(guide.fanRead?.hated?.cutId || "");
  const invalidSteveHighlights = runway.filter((moment) =>
    moment.category === "STRAIGHT TO STEVE'S ASSHOLE" &&
    !(
      moment.receiptKey && strictSteveKeys.has(moment.receiptKey) ||
      moment.guideCutId && moment.guideCutId === reviewedSteveCutId
    )
  ).map((moment) => moment.receiptKey || moment.guideCutId);
  const countMatchesCaseFile =
    Number(file.recap.caseFile?.highlightCount || 0) === runway.length;
  return {
    sourceId: file.id,
    duration: Number(file.source.duration || 0),
    registered: registered.length,
    requiredMomentAndCharacterReceipts: requiredKeys.length,
    expectedFloor,
    count: runway.length,
    missingRequired,
    foreignKeys,
    duplicateCount: actualKeys.length - uniqueKeys.size,
    chronological,
    categoriesComplete,
    invalidSteveHighlights,
    countMatchesCaseFile,
    pass:
      runway.length >= expectedFloor &&
      missingRequired.length === 0 &&
      foreignKeys.length === 0 &&
      actualKeys.length === uniqueKeys.size &&
      chronological &&
      categoriesComplete &&
      invalidSteveHighlights.length === 0 &&
      countMatchesCaseFile,
  };
});
const highlightRunwayFailures = highlightRunwayAudits.filter(
  (audit) => !audit.pass,
);
const guideStoryCoverage = legacyReady
  .filter((file) => file.source.showWiki?.episodeGuide?.schema === "wwam-episode-guide/v2")
  .map((file) => {
    const expected = new Set(guidePoints(file).map((point) => point.id));
    const used = new Set(file.recap.story.flatMap(
      (segment) => segment.guideCutIds || [],
    ));
    const missing = Array.from(expected).filter((id) => !used.has(id));
    const foreign = Array.from(used).filter((id) => !expected.has(id));
    const namedSegments = file.recap.story.filter(
      (segment) => String(segment.narrative?.primarySubject || "").trim(),
    ).length;
    return {
      sourceId: file.id,
      expected: expected.size,
      used: used.size,
      missing,
      foreign,
      segments: file.recap.story.length,
      namedSegments,
      reportedExpected: Number(file.recap.caseFile.storyGuidePointExpected || 0),
      reportedUsed: Number(file.recap.caseFile.storyGuidePointCount || 0),
      reportedPercent:
        Number(file.recap.caseFile.storyGuidePointCoveragePercent || 0),
    };
  });
const guideStoryCoverageFailures = guideStoryCoverage.filter((item) =>
  item.missing.length ||
  item.foreign.length ||
  item.namedSegments !== item.segments ||
  item.reportedExpected !== item.expected ||
  item.reportedUsed !== item.used ||
  item.reportedPercent !== 100
);
const comparison = legacyReady
  .filter((file) => file.legacyRecap && file.legacyRecap.overview)
  .map((file) => ({
    sourceId: file.id,
    title: file.title,
    tier: file.recap.tier,
    overlap: overlap(file.recap.overview, file.legacyRecap.overview),
    recapOverview: file.recap.overview,
    registeredOverview: file.legacyRecap.overview,
  }))
  .sort((left, right) => left.overlap - right.overlap || left.sourceId.localeCompare(right.sourceId));
const machineLeaks = ready.filter((file) =>
  /(?:^|\s)(?:TOPIC|CHARACTER PERFORMANCE)\s*:/i.test(recapText(file)),
);
const headlineAgreementErrors = ready.flatMap((file) =>
  /\b(?:RANKINGS? & LISTS?|REMAKES? & REBOOTS?|SEQUELS? & PREQUELS?|TRAILERS)\s+(?:GETS|WALKS|STARTS|OPENS|TAKES|LEAVES|HIDES|KICKS)\b/i
    .test(file.recap.headline)
    ? [{
        sourceId: file.id,
        location: "headline",
        text: file.recap.headline,
      }]
    : []
);
const storyAgreementErrors = storySegments.flatMap((segment) => {
  const body = String(segment.body || "").toLowerCase();
  const primary = displaySubject(segment.narrative?.primarySubject).toLowerCase();
  const topics = Array.from(new Set(
    (segment.topicLabels || []).map(displaySubject).filter(Boolean),
  )).filter((label) => label.toLowerCase() !== primary);
  const moments = Array.from(new Set(
    (segment.momentLabels || []).map(displaySubject).filter(Boolean),
  ));
  const characters = Array.from(new Set(
    (segment.characterLabels || []).map(displaySubject).filter(Boolean),
  ));
  const failures = [];
  if (topics.length === 1) {
    const topic = topics[0].toLowerCase();
    if (
      body.includes(`${topic} crowd the same hallway`) ||
      body.includes(`${topic} join ${primary}`)
    ) {
      failures.push("single-topic plural verb");
    }
  }
  if (
    moments.length === 1 &&
    body.includes(`${moments[0].toLowerCase()} supply the places`)
  ) {
    failures.push("single-moment plural verb");
  }
  if (characters.length === 1) {
    const character = characters[0].toLowerCase();
    if (
      body.includes(`${character} turn up in the same reel`) ||
      body.includes(`${character} share this stretch`)
    ) {
      failures.push("single-character plural verb");
    }
  }
  return failures.map((failure) => ({
    sourceId: segment.sourceId,
    location: segment.id || segment.label,
    failure,
    text: segment.body,
  }));
});
const storyLabelAgreementErrors = storySegments.flatMap((segment) => {
  const label = String(segment.label || "");
  const failures = [];
  if (
    /\b(?:RANKINGS? & LISTS?|REMAKES? & REBOOTS?|SEQUELS? & PREQUELS?|TRAILERS)\s+(?:SETS|GETS|CHANGES|TAKES)\b/i
      .test(label)
  ) {
    failures.push("plural story subject with singular verb");
  }
  if (/\bTHE THE\b/i.test(label)) {
    failures.push("doubled story-label article");
  }
  return failures.map((failure) => ({
    sourceId: segment.sourceId,
    location: segment.id || segment.label,
    failure,
    text: label,
  }));
});
const agreementErrors = headlineAgreementErrors
  .concat(storyAgreementErrors, storyLabelAgreementErrors);
const recapCopyGrammarFailures = ready.flatMap(generatedCopyGrammarFailures);
const duplicateLabels = legacyReady.filter((file) => {
  const labels = file.recap.sections.map((section) => section.label.toLowerCase());
  return new Set(labels).size !== labels.length;
});
function safePublicLaneReceipt(receipt) {
  if (!receipt) return false;
  const evidence = receipt.evidence && typeof receipt.evidence === "object"
    ? receipt.evidence
    : {};
  const status = [
    receipt.evidenceBasis,
    receipt.evidenceType,
    receipt.evidenceLevel,
    receipt.reviewState,
    receipt.reviewStatus,
    evidence.reviewStatus,
  ].map((value) => String(value || "")).join(" ");
  return !/(?:quarantin|machine[- ](?:candidate|surfaced)|review[- ]required|unreviewed)/i
    .test(status) &&
    receipt.promotionAllowed !== false &&
    evidence.promotionAllowed !== false &&
    receipt.humanEditorialReviewPerformed !== false;
}

const steveCandidateFiles = ready.filter((file) => {
  const lane = file.source.showWiki.lanes.find(
    (candidate) => candidate.id === "straight-to-steves-asshole",
  );
  return lane && lane.receiptKeys.length;
});
const steveFiles = steveCandidateFiles.filter((file) => {
  const lane = file.source.showWiki.lanes.find(
    (candidate) => candidate.id === "straight-to-steves-asshole",
  );
  const receipts = new Map(
    file.source.receipts.map((receipt) => [receipt.key, receipt]),
  );
  return lane.receiptKeys.some((key) =>
    safePublicLaneReceipt(receipts.get(key))
  );
});
const missingSteve = steveFiles.filter((file) => !file.recap.fanRead?.hated);
const earlyClosingLabels = legacyReady.flatMap((file) =>
  file.recap.sections
    .filter((section) => /^LAST (?:CALL|WORD)\b/.test(section.label))
    .filter((section) => section.at / Math.max(1, file.source.duration) < 0.85)
    .map((section) => ({
      sourceId: file.id,
      at: section.at,
      duration: file.source.duration,
      label: section.label,
    })),
);
const missingCaseFiles = files.filter((file) => !file.recap.caseFile);
const titleGoldens = {
  M3P4mMDpXUc: /SCREAM/i,
  QxJyVaAgZ_Y: /FRIDAY THE 13TH/i,
  KrBhfGxsJNM: /HALLOWEEN/i,
  nv99WEtXGvE: /A NIGHTMARE ON ELM STREET|FREDDY KRUEGER/i,
  qfJFZaC9pTE: /IT|DERRY/i,
  tUJviU09fWM: /TEXAS CHAINSAW/i,
  MSVltTVeypc: /HALLOWEEN/i,
  "Oi-s0ZuWDbM": /HORROR/i,
  QMYgsEfPMg0: /CHRISTMAS/i,
};
const titleGoldenFailures = Object.entries(titleGoldens).flatMap(([sourceId, pattern]) => {
  const file = ready.find((candidate) => candidate.id === sourceId);
  return !file || !pattern.test(file.recap.headline)
    ? [{ sourceId, headline: file?.recap.headline || "MISSING" }]
    : [];
});
const duplicateHeadlineGroups = Array.from(
  ready.reduce((groups, file) => {
    if (!groups.has(file.recap.headline)) groups.set(file.recap.headline, []);
    groups.get(file.recap.headline).push({
      sourceId: file.id,
      title: file.title,
    });
    return groups;
  }, new Map()),
)
  .filter(([, members]) => members.length > 1)
  .map(([headline, members]) => ({ headline, members }))
  .sort((left, right) =>
    right.members.length - left.members.length ||
    left.headline.localeCompare(right.headline),
  );
const heldSemanticClaimFailures = held.filter((file) =>
  file.recap.sections.length ||
  file.recap.story.length ||
  file.recap.highlightRunway?.length ||
  file.recap.bestMoments.length ||
  file.recap.topics.length ||
  Object.keys(file.recap.fanRead || {}).length,
);
const STORY_WORD_MIN = 8;
const STORY_WORD_MAX = 60;
const storyWordRangeFailures = storySegments.flatMap((segment) => {
  const count = wordCount(segment.body);
  const minimum = segment.publicModel === "human-editorial"
    ? 12
    : STORY_WORD_MIN;
  const maximum = segment.publicModel === "human-editorial"
    ? 90
    : STORY_WORD_MAX;
  return count < minimum || count > maximum
    ? [{
      sourceId: segment.sourceId,
      segmentId: segment.id,
      words: count,
      minimum,
      maximum,
      body: segment.body,
    }]
    : [];
});
const duplicateVisibleTopologyTopics = ready.flatMap((file) => {
  const lanes = file.publicModel === "human-editorial" ? [] : [
    ...(file.publicModel === "legacy" ? [{
      lane: "topics",
      values: (file.recap.topics || []).map((label) => ({
        label: String(label || ""),
        receiptKey: "",
      })),
    }] : []),
    {
      lane: "topicMap",
      values: (file.recap.topicMap || []).map((topic) => ({
        label: String(topic?.label || ""),
        receiptKey: String(topic?.receiptKey || ""),
      })),
    }
  ];
  return lanes.flatMap(({ lane, values }) => {
    const labels = new Map();
    const receiptKeys = new Set();
    const duplicates = [];
    values.forEach((value) => {
      const key = topologyKey(value.label);
      if (key && labels.has(key)) {
        duplicates.push({
          kind: "duplicate-label",
          label: value.label,
          first: labels.get(key),
        });
      } else if (key) {
        labels.set(key, value.label);
      }
      if (value.receiptKey && receiptKeys.has(value.receiptKey)) {
        duplicates.push({
          kind: "duplicate-receipt",
          receiptKey: value.receiptKey,
        });
      } else if (value.receiptKey) {
        receiptKeys.add(value.receiptKey);
      }
    });
    return duplicates.length
      ? [{ sourceId: file.id, lane, duplicates }]
      : [];
  });
});
const qmyGoldenFailures = (() => {
  const file = ready.find((candidate) => candidate.id === "QMYgsEfPMg0");
  if (!file) return [{ sourceId: "QMYgsEfPMg0", failure: "missing-ready-recap" }];
  const registered = file.legacyRecap || {};
  const firstRegisteredBlock = (registered.blocks || [])[0] || {};
  const titleSubjectSurfaces = [
    file.recap.headline,
    ...(file.recap.topics || []),
    ...file.recap.story.map((segment) =>
      segment.narrative?.primarySubject || segment.primarySubject
    ),
  ].join(" ");
  const lastAnchor = Math.max(
    0,
    ...file.recap.story.map((segment) =>
      Number(segment.anchorAt || segment.at || 0)
    ),
  );
  const lastEnd = Math.max(
    0,
    ...file.recap.story.map((segment) => Number(segment.end || 0)),
  );
  const duration = Math.max(1, Number(file.source.duration || 0));
  const failures = [];
  if (!/\bCHRISTMAS\b/i.test(titleSubjectSurfaces)) {
    failures.push("christmas-missing-from-feldman-recap");
  }
  if (
    file.publicModel === "legacy" &&
    !/\bCHRISTMAS\b/i.test(String(firstRegisteredBlock.body || ""))
  ) {
    failures.push("christmas-missing-from-registered-topic-block");
  }
  if (lastEnd / duration < 0.9) {
    failures.push("late-tail-missing");
  }
  if (
    Number(file.recap.caseFile?.lastPlayableAnchorPercent || 0) < 85 ||
    file.recap.caseFile?.closingPhaseCovered !== true
  ) {
    failures.push("case-file-does-not-report-closing-coverage");
  }
  return failures.map((failure) => ({
    sourceId: file.id,
    failure,
    duration,
    lastAnchor,
    lastEnd,
    lastPlayableAnchorPercent:
      Number(file.recap.caseFile?.lastPlayableAnchorPercent || 0),
    registeredFirstBlock: String(firstRegisteredBlock.body || ""),
  }));
})();
const readabilityAudit = auditRecapVoiceDiversity(ready);

const report = {
  generatedAt: new Date().toISOString(),
  corpus: {
    sources: files.length,
    ready: ready.length,
    held: held.length,
    publicModels: {
      humanEditorial: humanEditorialReady.length,
      structuredSourceSummary: structuredSummaryReady.length,
      legacy: legacyReady.length,
    },
    tiers: countBy(files, (file) => file.recap.tier),
  },
  depth: {
    sections: {
      total: sections.length,
      averagePerEligibleRecap: average(
        legacyReady.map((file) => file.recap.sections.length),
      ),
      minimum: legacyReady.length
        ? Math.min(...legacyReady.map((file) => file.recap.sections.length))
        : 0,
      maximum: Math.max(
        0,
        ...legacyReady.map((file) => file.recap.sections.length),
      ),
    },
    story: {
      segments: storySegments.length,
      humanEditorialSegments: humanStorySegments.length,
      legacySegments: legacyStorySegments.length,
      averageSegmentsPerEligibleRecap: average(
        publicStoryFiles.map((file) => file.recap.story.length),
      ),
      averageWordsPerSegment: average(storySegments.map((segment) =>
        prose(segment.body).split(" ").filter(Boolean).length,
      )),
      minimumWordsPerSegment: storySegments.length
        ? Math.min(...storySegments.map((segment) => wordCount(segment.body)))
        : 0,
      maximumWordsPerSegment: Math.max(
        0,
        ...storySegments.map((segment) => wordCount(segment.body)),
      ),
      requiredWordRange: {
        legacy: {
          minimum: STORY_WORD_MIN,
          maximum: STORY_WORD_MAX,
        },
        humanEditorial: {
          minimum: 12,
          maximum: 90,
        },
      },
      receiptsAccountedFor: legacyReady.reduce(
        (total, file) => total + new Set(
          file.recap.story.flatMap(storyReceiptKeys),
        ).size,
        0,
      ),
      visibleReceiptsAccountedFor: legacyReady.reduce(
        (total, file) => total + new Set(
          file.recap.story.flatMap((segment) =>
            (segment.receiptKeys || []).map(String)
          ),
        ).size,
        0,
      ),
      hiddenReceiptsAccountedFor: legacyReady.reduce(
        (total, file) => total + new Set(
          file.recap.story.flatMap(hiddenStoryReceiptKeys),
        ).size,
        0,
      ),
      timelineReceiptsAccountedFor: legacyReady.reduce(
        (total, file) => total + new Set(
          file.recap.story
            .flatMap(storyReceiptKeys)
            .filter((key) => /:timeline:/i.test(key)),
        ).size,
        0,
      ),
      registeredTimelineReceipts: legacyReady.reduce(
        (total, file) => total + new Set(
          file.source.receipts
            .map((receipt) => String(receipt.key || ""))
            .filter((key) => /:timeline:/i.test(key)),
        ).size,
        0,
      ),
      registeredReceipts: legacyReady.reduce(
        (total, file) => total + file.recap.caseFile.receiptCount,
        0,
      ),
      narrativeBeatSegments: legacyStorySegments.filter((segment) =>
        segment.narrative?.schema === "shokker-recap-narrative-beat/v1"
      ).length,
      namedSegments: legacyStorySegments.filter((segment) =>
        String(segment.narrative?.primarySubject || "").trim()
      ).length,
      directAnchorSegments: legacyStorySegments.filter((segment) =>
        segment.narrative?.anchorSupportsPrimary === true
      ).length,
      separateSpikeSegments: legacyStorySegments.filter((segment) =>
        segment.narrative?.anchorSupportsPrimary === false
      ).length,
      inventoryOnlySegments: inventoryStorySegments.length,
      guideBackedRecaps: guideStoryCoverage.length,
      guidePointsAccountedFor: guideStoryCoverage.reduce(
        (total, item) => total + item.used,
        0,
      ),
      registeredGuidePoints: guideStoryCoverage.reduce(
        (total, item) => total + item.expected,
        0,
      ),
    },
    humanEditorial: {
      recaps: humanEditorialReady.length,
      storyReels: humanStorySegments.length,
      highlights: humanEditorialReady.reduce(
        (total, file) => total + file.recap.highlightRunway.length,
        0,
      ),
      panels: humanEditorialReady.reduce(
        (total, file) => total + (file.recap.editorialPanels || []).length,
        0,
      ),
      fanReadLanes: humanEditorialReady.reduce(
        (total, file) => total + Object.keys(file.recap.fanRead || {}).length,
        0,
      ),
    },
    actEvidence: {
      registeredReceipts: actEvidenceTotals.registered,
      usedReceipts: actEvidenceTotals.used,
      usedPercent: actEvidenceTotals.registered
        ? Math.round(actEvidenceTotals.used / actEvidenceTotals.registered * 1000) / 10
        : 100,
      registeredByKind: actEvidenceTotals.registeredByKind,
      usedByKind: actEvidenceTotals.usedByKind,
      usedPercentByKind: Object.fromEntries(
        Object.keys(actEvidenceTotals.registeredByKind).map((kind) => [
          kind,
          actEvidenceTotals.registeredByKind[kind]
            ? Math.round(
              actEvidenceTotals.usedByKind[kind] /
                actEvidenceTotals.registeredByKind[kind] * 1000,
            ) / 10
            : 100,
        ]),
      ),
      openingCategory: actEvidenceTotals.openings,
    },
    topics: {
      averagePerLegacyRecap: average(legacyReady.map((file) =>
        new Set(file.recap.sections.flatMap((section) => section.receiptKeys)).size,
      )),
      recapsWithGenericFeldmanZoneHeadline: ready.filter((file) =>
        /TAPE HAS ENTERED THE FELDMAN ZONE/.test(file.recap.headline),
      ).length,
    },
    bestMomentsAverage: average(ready.map((file) => file.recap.bestMoments.length)),
    highlightRunway: {
      total: highlightRunwayAudits.reduce((total, audit) => total + audit.count, 0),
      averagePerEligibleRecap: average(
        highlightRunwayAudits
          .filter((audit) => audit.requiredMomentAndCharacterReceipts > 0)
          .map((audit) => audit.count),
      ),
      maximum: Math.max(0, ...highlightRunwayAudits.map((audit) => audit.count)),
      recapsOver15: highlightRunwayAudits.filter((audit) => audit.count > 15).length,
      byRuntime: {
        under45Minutes: countBy(
          highlightRunwayAudits.filter((audit) => audit.duration < 2700),
          (audit) => audit.count,
        ),
        minutes45To89: countBy(
          highlightRunwayAudits.filter((audit) =>
            audit.duration >= 2700 && audit.duration < 5400
          ),
          (audit) => audit.count,
        ),
        minutes90To119: countBy(
          highlightRunwayAudits.filter((audit) =>
            audit.duration >= 5400 && audit.duration < 7200
          ),
          (audit) => audit.count,
        ),
        hours2To3: countBy(
          highlightRunwayAudits.filter((audit) =>
            audit.duration >= 7200 && audit.duration < 10800
          ),
          (audit) => audit.count,
        ),
        hours3Plus: countBy(
          highlightRunwayAudits.filter((audit) => audit.duration >= 10800),
          (audit) => audit.count,
        ),
      },
    },
    fanReadLanes: countBy(
      ready.flatMap((file) => Object.keys(file.recap.fanRead || {})),
      (lane) => lane,
    ),
  },
  voice: {
    uniqueHeadlines: new Set(ready.map((file) => file.recap.headline)).size,
    uniqueDecks: new Set(ready.map((file) => file.recap.deck)).size,
    duplicateHeadlineGroups,
    sectionLabelPrefixes: countBy(sections, (section) => prefix(section.label)),
    storyReelOpenings: countBy(storySegments, (segment) => prefix(segment.label)),
    repeatedOverviewColor: countBy(ready, (file) => {
      const match = file.recap.overview.match(
        /(In plain English[^.]*\.|This is the one where[^.]*\.|The tape moves like[^.]*\.|It starts as a show[^.]*\.)/,
      );
      return match ? match[1] : "GUIDE_OR_OTHER";
    }),
  },
  quality: {
    machineLabelLeaks: machineLeaks.map((file) => file.id),
    pluralAgreementErrors: agreementErrors,
    generatedCopyGrammarFailures: recapCopyGrammarFailures,
    duplicateActLabels: duplicateLabels.map((file) => file.id),
    storyWordRangeFailures,
    duplicateVisibleTopologyTopics,
    qmyGoldenFailures,
    steveLaneCandidates: steveCandidateFiles.length,
    steveLaneSources: steveFiles.length,
    unsafeSteveLaneCandidatesWithheld:
      steveCandidateFiles.length - steveFiles.length,
    steveLaneCarriedIntoRecap: steveFiles.length - missingSteve.length,
    missingSteve: missingSteve.map((file) => file.id),
    earlyClosingLabels,
    missingCaseFiles: missingCaseFiles.map((file) => file.id),
    heldSemanticClaimFailures: heldSemanticClaimFailures.map((file) => file.id),
    titleGoldenFailures,
    humanEditorialTruthFailures,
    structuredPublicSummaryFailures,
    storyCoverageFailures,
    storyAnchorFailures,
    namelessStorySegments,
    inventoryStorySegments: inventoryStorySegments.slice(0, 50),
    storyNarrativeBeatFailures,
    storySemanticAnchorFailures,
    bestMomentSelectionFailures,
    highlightRunwayFailures,
    guideStoryCoverageFailures,
  },
  readability: readabilityAudit,
  unusedRegisteredOverviewSignal: {
    compared: comparison.length,
    averageWordOverlapPercent: average(comparison.map((item) => item.overlap)),
    under25Percent: comparison.filter((item) => item.overlap < 25).length,
    weakestExamples: comparison.slice(0, 15),
  },
};
report.gates = {
  everyRegisteredReceiptInWrittenStory:
    report.depth.story.receiptsAccountedFor ===
    report.depth.story.registeredReceipts,
  hiddenTimelineReceiptsAccountedFor:
    report.depth.story.timelineReceiptsAccountedFor ===
    report.depth.story.registeredTimelineReceipts,
  storyProseIsConcise:
    report.quality.storyWordRangeFailures.length === 0,
  visibleTopologyTopicsAreUnique:
    report.quality.duplicateVisibleTopologyTopics.length === 0,
  qmyTitleSubjectAndLateTailPass:
    report.quality.qmyGoldenFailures.length === 0,
  recapReadabilityPass:
    report.readability.pass === true,
  steveLanesRetained:
    report.quality.steveLaneCarriedIntoRecap ===
    report.quality.steveLaneSources,
  noHeldSemanticClaims:
    report.quality.heldSemanticClaimFailures.length === 0,
  noMachineLabels:
    report.quality.machineLabelLeaks.length === 0,
  noGrammarFailures:
    report.quality.pluralAgreementErrors.length === 0 &&
    report.quality.generatedCopyGrammarFailures.length === 0,
  noDuplicateActLabels:
    report.quality.duplicateActLabels.length === 0,
  noEarlyClosingLabels:
    report.quality.earlyClosingLabels.length === 0,
  everyRecapHasCaseFile:
    report.quality.missingCaseFiles.length === 0,
  titleSubjectGoldensPass:
    report.quality.titleGoldenFailures.length === 0,
  humanEditorialTruthPass:
    report.quality.humanEditorialTruthFailures.length === 0,
  structuredPublicSummariesPass:
    report.quality.structuredPublicSummaryFailures.length === 0,
  writtenStoryCoveragePass:
    report.quality.storyCoverageFailures.length === 0,
  writtenStoryAnchorsPass:
    report.quality.storyAnchorFailures.length === 0,
  everyStoryReelHasNarrativeBeat:
    report.depth.story.narrativeBeatSegments ===
    report.depth.story.legacySegments,
  everyStoryReelNamesItsEvidence:
    report.depth.story.namedSegments ===
      report.depth.story.legacySegments &&
    report.quality.namelessStorySegments.length === 0,
  noInventoryOnlyStoryReels:
    report.depth.story.inventoryOnlySegments === 0,
  narrativeBeatEvidencePass:
    report.quality.storyNarrativeBeatFailures.length === 0,
  storySubjectAnchorSemanticsPass:
    report.quality.storySemanticAnchorFailures.length === 0,
  bestMomentsAreSelective:
    report.quality.bestMomentSelectionFailures.length === 0,
  highlightRunwaysPreserveEveryRegisteredMoment:
    report.quality.highlightRunwayFailures.length === 0,
  reviewedGuideStoryCoveragePass:
    report.depth.story.guidePointsAccountedFor ===
      report.depth.story.registeredGuidePoints &&
    report.quality.guideStoryCoverageFailures.length === 0,
};
report.pass = Object.values(report.gates).every(Boolean);

const sourceFlag = process.argv.indexOf("--source");
if (sourceFlag >= 0) {
  const sourceId = String(process.argv[sourceFlag + 1] || "");
  const file = files.find((item) => item.id === sourceId);
  if (!file) {
    throw new Error(`Unknown canonical source: ${sourceId}`);
  }
  process.stdout.write(`${JSON.stringify({
    id: file.id,
    title: file.title,
    duration: file.source.duration,
    coverage: file.coverage,
    receipts: file.source.receipts,
    officialAlternate: file.source.officialAlternate || null,
    warnings: file.source.warnings || [],
    episodeGuide: file.source.showWiki.episodeGuide,
    recap: file.recap,
    registeredRecap: file.legacyRecap,
    lanes: file.source.showWiki.lanes,
  }, null, 2)}\n`);
} else if (process.argv.includes("--inventory")) {
  process.stdout.write(`${JSON.stringify(files.map((file) => ({
    id: file.id,
    title: file.title,
    date: file.source.date,
    duration: file.source.duration,
    views: file.source.views,
    url: file.source.url,
    coverage: file.coverage,
    state: file.recap.state,
    tier: file.recap.tier,
    publicModel: file.publicModel,
    receiptCount: file.recap.caseFile?.receiptCount || 0,
    sectionCount: file.recap.sections.length,
    storyCount: file.recap.story.length,
    topicCount: file.recap.topics.length,
    bestMomentCount: file.recap.bestMoments.length,
    fanReadLanes: Object.keys(file.recap.fanRead || {}),
  })), null, 2)}\n`);
} else if (process.argv.includes("--json")) {
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
} else {
  process.stdout.write(
    [
      "WWAM EPISODE RECAP QUALITY AUDIT",
      `Sources: ${report.corpus.sources} // ready ${report.corpus.ready} // held ${report.corpus.held}`,
      `Public recap models: ${JSON.stringify(report.corpus.publicModels)}`,
      `Tiers: ${JSON.stringify(report.corpus.tiers)}`,
      `Legacy public sections: ${report.depth.sections.total} total // ${report.depth.sections.averagePerEligibleRecap} average`,
      `Written story: ${report.depth.story.segments} reels // ${report.depth.story.receiptsAccountedFor}/${report.depth.story.registeredReceipts} receipts accounted for // ${report.depth.story.timelineReceiptsAccountedFor}/${report.depth.story.registeredTimelineReceipts} hidden timeline receipts`,
      `Authored story depth: ${report.depth.story.minimumWordsPerSegment}-${report.depth.story.maximumWordsPerSegment} words/reel // human ${report.depth.story.humanEditorialSegments} // legacy ${report.depth.story.legacySegments}`,
      `Human editorial surfaces: ${report.depth.humanEditorial.recaps} recaps // ${report.depth.humanEditorial.storyReels} story reels // ${report.depth.humanEditorial.highlights} highlights // ${report.depth.humanEditorial.panels} panels // ${report.depth.humanEditorial.fanReadLanes} fan lanes`,
      `Subject-safe story anchors: ${report.depth.story.directAnchorSegments} direct // ${report.depth.story.separateSpikeSegments} explicitly separate`,
      `Reviewed guide carry-through: ${report.depth.story.guidePointsAccountedFor}/${report.depth.story.registeredGuidePoints} timed points across ${report.depth.story.guideBackedRecaps} full chronicles`,
      `Inventory-only / nameless reels: ${report.depth.story.inventoryOnlySegments} / ${report.quality.namelessStorySegments.length}`,
      `Playable acts: ${report.depth.actEvidence.usedReceipts}/${report.depth.actEvidence.registeredReceipts} receipts // ${report.depth.actEvidence.usedPercent}%`,
      `Act topic carry-through: ${report.depth.actEvidence.usedByKind.topic}/${report.depth.actEvidence.registeredByKind.topic} // ${report.depth.actEvidence.usedPercentByKind.topic}%`,
      `Act openings by evidence: ${JSON.stringify(report.depth.actEvidence.openingCategory)}`,
      `Unique headlines: ${report.voice.uniqueHeadlines}/${report.corpus.ready}`,
      `Unique decks: ${report.voice.uniqueDecks}/${report.corpus.ready}`,
      `Registered-overview overlap: ${report.unusedRegisteredOverviewSignal.averageWordOverlapPercent}% average`,
      `Recaps below 25% registered-overview overlap: ${report.unusedRegisteredOverviewSignal.under25Percent}`,
      `Story word-range failures: ${report.quality.storyWordRangeFailures.length}`,
      `Duplicate visible topology topics: ${report.quality.duplicateVisibleTopologyTopics.length}`,
      `QMY title-subject / late-tail failures: ${report.quality.qmyGoldenFailures.length}`,
      `Readability failures: caption ${report.readability.flags.rawCaptionMarkers.occurrences} // metaphors ${report.readability.flags.forbiddenMetaphors.occurrences} // excerpt reuse ${report.readability.flags.rawExcerptReuse.occurrences} // quote salad ${report.readability.flags.quoteSalad.occurrences} // // AGAIN ${report.readability.flags.againSuffixes.occurrences} // speaker ${report.readability.flags.speakerOverclaims.occurrences} // firewall ${report.readability.flags.firewallCopy.occurrences}`,
      `Machine-label leaks: ${report.quality.machineLabelLeaks.length}`,
      `Plural-agreement failures: ${report.quality.pluralAgreementErrors.length}`,
      `Generated-copy grammar failures: ${report.quality.generatedCopyGrammarFailures.length}`,
      `Duplicate act labels: ${report.quality.duplicateActLabels.length}`,
      `Steve lanes carried into recap: ${report.quality.steveLaneCarriedIntoRecap}/${report.quality.steveLaneSources}`,
      `Early LAST WORD labels: ${report.quality.earlyClosingLabels.length}`,
      `Missing case files: ${report.quality.missingCaseFiles.length}`,
      `Title-subject golden failures: ${report.quality.titleGoldenFailures.length}`,
      `Human editorial truth failures: ${report.quality.humanEditorialTruthFailures.length}`,
      `Structured public-summary failures: ${report.quality.structuredPublicSummaryFailures.length}`,
      `Written-story coverage failures: ${report.quality.storyCoverageFailures.length}`,
      `Written-story anchor failures: ${report.quality.storyAnchorFailures.length}`,
      `Narrative-beat evidence failures: ${report.quality.storyNarrativeBeatFailures.length}`,
      `Subject/anchor semantic failures: ${report.quality.storySemanticAnchorFailures.length}`,
      `Best-moment selection failures: ${report.quality.bestMomentSelectionFailures.length}`,
      `Highlight runway: ${report.depth.highlightRunway.total} stops // ${report.depth.highlightRunway.averagePerEligibleRecap} eligible-show average // max ${report.depth.highlightRunway.maximum} // ${report.depth.highlightRunway.recapsOver15} shows over 15`,
      `Highlight runway contract failures: ${report.quality.highlightRunwayFailures.length}`,
      `Reviewed-guide story coverage failures: ${report.quality.guideStoryCoverageFailures.length}`,
      `Held-source semantic claim failures: ${report.quality.heldSemanticClaimFailures.length}`,
      `RECAP QUALITY GATE: ${report.pass ? "PASS" : "FAIL"}`,
      "",
      "Most repeated section labels:",
      ...Object.entries(report.voice.sectionLabelPrefixes)
        .sort((left, right) => right[1] - left[1])
        .slice(0, 12)
        .map(([label, count]) => `  ${String(count).padStart(3)}  ${label}`),
      "",
      "Repeated episode headlines:",
      ...(report.voice.duplicateHeadlineGroups.length
        ? report.voice.duplicateHeadlineGroups.slice(0, 10).map((group) =>
          `  ${String(group.members.length).padStart(3)}  ${group.headline}`,
        )
        : ["    0  NONE"]),
      "",
      "Weakest registered-overview carry-through:",
      ...report.unusedRegisteredOverviewSignal.weakestExamples
        .slice(0, 10)
        .map((item) => `  ${String(item.overlap).padStart(3)}%  ${item.sourceId}  ${item.title}`),
    ].join("\n") + "\n",
  );
}
if (process.argv.includes("--check") && !report.pass) {
  process.exitCode = 1;
}
