import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const demo = process.env.WWAM_SEMANTIC_DEMO_DIR
  ? path.resolve(process.env.WWAM_SEMANTIC_DEMO_DIR)
  : path.join(root, "public", "demo");

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
  "episode-editorial-packs-wave37.js",
  "episode-editorial-packs-wave38.js",
  "episode-editorial-packs-wave39.js",
  "episode-editorial-packs-wave40.js",
  "episode-editorial-packs-wave41.js",
  "episode-editorial-packs-wave42.js",
  "episode-editorial-packs-wave43.js",
  "episode-editorial-packs-wave44.js",
  "episode-editorial-packs-wave45.js",
  "episode-editorial-packs-wave46.js",
  "episode-editorial-packs-wave47.js",
  "episode-editorial-packs-wave48.js",
  "episode-editorial-packs-wave49.js",
  "episode-editorial-packs-wave50.js",
  "episode-editorial-packs-wave51.js",
  "episode-editorial-packs-wave52.js",
  "episode-editorial-packs-wave53.js",
  "episode-editorial-packs-wave54.js",
  "episode-editorial-packs-wave55.js",
  "episode-editorial-packs-wave56.js",
  "episode-editorial-packs-wave57.js",
  "episode-editorial-packs-wave58.js",
  "episode-editorial-packs-wave59.js",
  "episode-editorial-packs-wave60.js",
  "episode-editorial-packs-wave61.js",
  "episode-editorial-packs-wave62.js",
  "episode-editorial-packs-wave63.js",
  "episode-editorial-packs-wave64.js",
  "episode-editorial-packs-wave65.js",
  "episode-editorial-packs-wave66.js",
  "episode-recap-engine.js",
  "wwam-episode-recap-adapter.js",
  "wwam-source-dossier-adapter.js",
];

const genericHighlightSubjects = new Set([
  "big laugh",
  "biggest laugh",
  "full send",
  "funny moment",
  "high heat",
  "hot take",
  "major topic turn",
  "out of pocket",
  "replay",
  "reviewed show cut",
  "saved moment",
  "show checkpoint",
  "soundbyte",
  "soundbyte replay",
  "steve hates this",
  "stinger",
  "straight to steves asshole",
  "take gets nuclear",
  "the room breaks",
  "up in ya",
  "wildest detour",
]);

const continuousRangePattern =
  /\bfrom\s+(?:\d{1,2}:)?\d{1,2}:\d{2}\s+(?:to|through|until|[-–—])\s+(?:\d{1,2}:)?\d{1,2}:\d{2}\b/i;
const episodeNarrativePatterns = [
  /\b(?:the|this)\s+(?:episode|show|conversation|discussion|commentary)\s+(?:opens|begins|starts|moves|shifts|turns|centers|closes|ends)\b/i,
  /\b(?:around|in)\s+the\s+middle\b/i,
  /\bfinal\s+indexed\s+chapter\b/i,
  /\bchronological\s+chapters?\b/i,
  /\bthe\s+final\s+(?:chapter|reel)\s+(?:runs|reaches|lands|closes)\b/i,
  /\bconversation\s+centers\s+on\b/i,
];
const highlightClaimPatterns = [
  /\bstrongest\s+saved\s+(?:moment|beat|highlight|reaction)\b/i,
  /\bsaved\s+(?:highlight|moment|reaction)\s+(?:marker|markers|starts|lands|is|at)\b/i,
  /\b(?:best|funniest|wildest|biggest)\s+(?:moment|moments|bit|bits|laugh|laughs|detour|take)\b/i,
  /\bplayable\s+reaction\s+marker\b/i,
  /\bsource-bound\s+reaction\b/i,
  /\bhot\s+take\b/i,
  /\b(?:show|episode)\s+(?:defended|hated|loved)\b/i,
];

function array(value) {
  return Array.isArray(value) ? value : [];
}

function record(value) {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value
    : {};
}

function clean(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function number(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function optionalNumber(value) {
  const parsed = Number(value);
  return value !== null && value !== "" && Number.isFinite(parsed)
    ? parsed
    : null;
}

function normalize(value) {
  return clean(value)
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/^(?:topic|character performance|character|moment)\s*:\s*/i, "")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function clock(seconds) {
  const total = Math.max(0, Math.round(number(seconds)));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const remainder = total % 60;
  return hours
    ? `${hours}:${String(minutes).padStart(2, "0")}:${String(remainder).padStart(2, "0")}`
    : `${minutes}:${String(remainder).padStart(2, "0")}`;
}

function clockSeconds(value) {
  const parts = clean(value).split(":").map(Number);
  if (
    (parts.length !== 2 && parts.length !== 3) ||
    parts.some((part) => !Number.isFinite(part))
  ) {
    return null;
  }
  return parts.length === 3
    ? parts[0] * 3600 + parts[1] * 60 + parts[2]
    : parts[0] * 60 + parts[1];
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function countBy(values, getter) {
  return values.reduce((counts, value) => {
    const key = String(getter(value) || "NONE");
    counts[key] = (counts[key] || 0) + 1;
    return counts;
  }, {});
}

function compile() {
  runtimeFiles.forEach((file) => {
    if (!fs.existsSync(path.join(demo, file))) {
      throw new Error(`Semantic audit runtime file is missing: ${path.join(demo, file)}`);
    }
  });
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
  const dossier = runtime.WWAMSourceDossierAdapter.build({
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
      packFingerprint: "fnv1a32:episode-semantics-audit",
    },
  });
  return {
    dossier,
    titleTopicOverrides: record(runtime.WWAM_TITLE_TOPIC_OVERRIDES),
  };
}

function storySubject(segment) {
  const item = record(segment);
  const narrative = record(item.narrative);
  const fromLabel = clean(item.label).includes("//")
    ? clean(item.label).split("//").slice(1).join("//")
    : "";
  return clean(
    item.primarySubject ||
      narrative.primarySubject ||
      item.anchor ||
      fromLabel,
  );
}

function displayedStoryWindow(segment) {
  const item = record(segment);
  const hasPublishedWindow =
    Object.prototype.hasOwnProperty.call(item, "displayAt") &&
    Object.prototype.hasOwnProperty.call(item, "displayEnd");
  return hasPublishedWindow
    ? { at: number(item.displayAt), end: number(item.displayEnd) }
    : { at: number(item.at), end: number(item.end) };
}

function isGenericHighlightSubject(value) {
  const key = normalize(value);
  return genericHighlightSubjects.has(key) ||
    /^(?:chapter|reel|runtime|segment|part)\s+\d+$/.test(key);
}

function isHumanEditorialRecap(recap) {
  return clean(recap?.editorialState) ===
    "full-tape-human-editorial-read";
}

function humanEditorialWindowFailure(
  item,
  duration,
  { requirePlayWindow = true } = {},
) {
  const at = optionalNumber(item?.at);
  const end = optionalNumber(item?.end);
  if (
    at === null ||
    end === null ||
    at < 0 ||
    end <= at ||
    (duration > 0 && end > duration)
  ) {
    return {
      kind: "invalid-editorial-window",
      at,
      end,
      duration,
    };
  }
  if (!requirePlayWindow) return null;
  const playAt = optionalNumber(item?.playAt);
  const playEnd = optionalNumber(item?.playEnd);
  if (
    playAt === null ||
    playEnd === null ||
    Math.abs(playAt - at) > 0.001 ||
    Math.abs(playEnd - end) > 0.001
  ) {
    return {
      kind: "editorial-play-window-drift",
      at,
      end,
      playAt,
      playEnd,
    };
  }
  return null;
}

function publicSurfaces(file) {
  const recap = file.recap;
  return [
    ["headline", recap.headline],
    ["deck", recap.deck],
    ["overview", recap.overview],
    ...array(recap.topics).map((value, index) => [`topics[${index}]`, value]),
    ...array(recap.story).flatMap((segment, index) => [
      [`story[${index}].label`, segment.label],
      [`story[${index}].body`, segment.body],
      [`story[${index}].primarySubject`, storySubject(segment)],
    ]),
    ...array(recap.sections).flatMap((section, index) => [
      [`sections[${index}].label`, section.label],
      [`sections[${index}].body`, section.body],
      [`sections[${index}].anchor`, section.anchor],
    ]),
    ...array(recap.bestMoments).flatMap((moment, index) => [
      [`bestMoments[${index}].label`, moment.label],
      [`bestMoments[${index}].body`, moment.body],
    ]),
    ...array(recap.highlightRunway).map((moment, index) => [
      `highlightRunway[${index}].label`,
      moment.label,
    ]),
    ...Object.entries(record(recap.fanRead)).flatMap(([key, item]) => [
      [`fanRead.${key}.label`, item.label],
      [`fanRead.${key}.topic`, item.topic],
      [`fanRead.${key}.body`, item.body],
    ]),
    ...array(recap.editorialPanels).flatMap((panel, panelIndex) => [
      [`editorialPanels[${panelIndex}].title`, panel.title],
      [`editorialPanels[${panelIndex}].intro`, panel.intro],
      [`editorialPanels[${panelIndex}].note`, panel.note],
      ...array(panel.groups).flatMap((group, groupIndex) => [
        [
          `editorialPanels[${panelIndex}].groups[${groupIndex}].label`,
          group.label,
        ],
        ...array(group.items).map((item, itemIndex) => [
          `editorialPanels[${panelIndex}].groups[${groupIndex}].items[${itemIndex}]`,
          item,
        ]),
      ]),
      ...array(panel.items).flatMap((item, itemIndex) => [
        [
          `editorialPanels[${panelIndex}].items[${itemIndex}].subject`,
          item.subject,
        ],
        [
          `editorialPanels[${panelIndex}].items[${itemIndex}].verdict`,
          item.verdict,
        ],
        [
          `editorialPanels[${panelIndex}].items[${itemIndex}].character`,
          item.character,
        ],
        [
          `editorialPanels[${panelIndex}].items[${itemIndex}].label`,
          item.label,
        ],
      ]),
    ]),
  ].map(([surface, value]) => ({
    surface,
    text: clean(value),
  })).filter((item) => item.text);
}

function topicProseSurfaces(file) {
  const recap = file.recap;
  return [
    ["deck", recap.deck],
    ["overview", recap.overview],
    ...array(recap.story).map((segment, index) => [
      `story[${index}].body`,
      segment.body,
    ]),
    ...array(recap.sections).map((section, index) => [
      `sections[${index}].body`,
      section.body,
    ]),
    ...Object.entries(record(recap.fanRead)).map(([key, item]) => [
      `fanRead.${key}.body`,
      item.body,
    ]),
  ].map(([surface, value]) => ({
    surface,
    text: clean(value),
  })).filter((item) => item.text);
}

function proseMatch(file, item, kind, patterns) {
  const match = patterns.find((pattern) => pattern.test(item.text));
  return match
    ? {
      sourceId: file.id,
      title: file.title,
      surface: item.surface,
      kind,
      match: item.text.match(match)?.[0] || "",
      text: item.text,
    }
    : null;
}

function matchingLabel(left, right) {
  return normalize(left) === normalize(right);
}

function matchingTitleReceipt(source, expected) {
  return array(source.receipts).find((receipt) =>
    matchingLabel(receipt.label, expected.label) &&
    /caption-title-topic-receipt/i.test(clean(receipt.evidenceType))
  );
}

function matchingTopicMap(recap, expected) {
  return array(recap.topicMap).find((topic) =>
    matchingLabel(topic.label, expected.label)
  );
}

function matchingStoryTopicEvidence(recap, expected, receipt) {
  for (const [segmentIndex, segment] of array(recap.story).entries()) {
    const evidence = array(segment.topicEvidence).find((topic) =>
      (receipt && clean(topic.receiptKey) === clean(receipt.key)) ||
      matchingLabel(topic.label, expected.label)
    );
    if (evidence) return { segment, segmentIndex, evidence };
  }
  return null;
}

function sentences(value) {
  return clean(value).match(/[^.!?]+[.!?]?/g) || [];
}

function timedTitleClaims(file, expected) {
  const recap = file.recap;
  const surfaces = [
    ["overview", recap.overview],
    ...array(recap.story).flatMap((segment, index) => {
      const ownsTopic = matchingLabel(storySubject(segment), expected.label) ||
        array(segment.topicEvidence).some((topic) =>
          matchingLabel(topic.label, expected.label)
        );
      return ownsTopic ? [[`story[${index}].body`, segment.body]] : [];
    }),
    ...array(recap.sections).flatMap((section, index) => {
      const ownsTopic =
        matchingLabel(section.anchor, expected.label) ||
        clean(section.label).toLowerCase().includes(
          clean(expected.label).toLowerCase(),
        );
      return ownsTopic ? [[`sections[${index}].body`, section.body]] : [];
    }),
  ];
  const labelPattern = new RegExp(
    `\\b${escapeRegExp(clean(expected.label)).replace(/\\ /g, "\\s+")}\\b`,
    "i",
  );
  const timePattern = /\b(?:\d{1,2}:)?\d{1,2}:\d{2}\b/g;
  const firstOccurrenceClaim =
    /\b(?:first|enters?|opens?|begins?|arrives?|surfaces?|registers?|title subject)\b/i;
  return surfaces.flatMap(([surface, value]) =>
    sentences(value).flatMap((sentence) => {
      if (!labelPattern.test(sentence)) return [];
      if (!firstOccurrenceClaim.test(sentence)) return [];
      const clocks = sentence.match(timePattern) || [];
      if (!clocks.length) return [];
      return [{
        sourceId: file.id,
        title: file.title,
        label: clean(expected.label),
        expectedFirstAt: number(expected.firstAt),
        expectedClock: clock(expected.firstAt),
        surface,
        clocks,
        seconds: clocks.map(clockSeconds),
        text: clean(sentence),
      }];
    })
  );
}

function auditHumanEditorialSurfaces(files) {
  const storyFailures = [];
  const highlightFailures = [];
  const panelFailures = [];
  const packsWithoutPanels = [];
  const humanFiles = files.filter((file) =>
    file.recap.state === "ready" &&
    isHumanEditorialRecap(file.recap)
  );

  function addFailure(target, file, surface, detail) {
    target.push({
      sourceId: file.id,
      title: file.title,
      surface,
      ...detail,
    });
  }

  humanFiles.forEach((file) => {
    const duration = number(file.source.duration);
    const story = array(file.recap.story);
    if (!story.length) {
      addFailure(storyFailures, file, "story", {
        kind: "missing-human-editorial-story",
      });
    }
    story.forEach((segment, index) => {
      const surface = `story[${index}]`;
      if (!clean(segment.label) || !clean(segment.body)) {
        addFailure(storyFailures, file, surface, {
          kind: "incomplete-human-editorial-story",
          label: clean(segment.label),
        });
      }
      if (
        clean(segment.evidenceBasis) !==
          "full-tape-human-editorial-read" ||
        clean(record(segment.narrative).kind) !== "human-editorial-story"
      ) {
        addFailure(storyFailures, file, surface, {
          kind: "invalid-human-editorial-story-basis",
          label: clean(segment.label),
        });
      }
      const windowFailure = humanEditorialWindowFailure(segment, duration);
      if (windowFailure) {
        addFailure(storyFailures, file, surface, {
          ...windowFailure,
          label: clean(segment.label),
        });
      }
    });

    const highlights = array(file.recap.highlightRunway);
    if (!highlights.length) {
      addFailure(highlightFailures, file, "highlightRunway", {
        kind: "missing-human-editorial-highlights",
      });
    }
    const highlightIdentities = new Set();
    highlights.forEach((highlight, index) => {
      const surface = `highlightRunway[${index}]`;
      if (
        !clean(highlight.label) ||
        !clean(highlight.category) ||
        !clean(highlight.excerpt)
      ) {
        addFailure(highlightFailures, file, surface, {
          kind: "incomplete-human-editorial-highlight",
          label: clean(highlight.label),
        });
      }
      if (
        clean(highlight.evidenceBasis) !==
          "full-tape-human-editorial-read" ||
        clean(highlight.kind) !== "human-editorial-highlight"
      ) {
        addFailure(highlightFailures, file, surface, {
          kind: "invalid-human-editorial-highlight-basis",
          label: clean(highlight.label),
        });
      }
      const windowFailure = humanEditorialWindowFailure(
        highlight,
        duration,
      );
      if (windowFailure) {
        addFailure(highlightFailures, file, surface, {
          ...windowFailure,
          label: clean(highlight.label),
        });
      }
      const identity = `${number(highlight.at)}|${normalize(highlight.label)}`;
      if (highlightIdentities.has(identity)) {
        addFailure(highlightFailures, file, surface, {
          kind: "duplicate-human-editorial-highlight",
          label: clean(highlight.label),
        });
      }
      highlightIdentities.add(identity);
      const previous = highlights[index - 1];
      if (previous && number(highlight.at) < number(previous.at)) {
        addFailure(highlightFailures, file, surface, {
          kind: "out-of-order-human-editorial-highlight",
          label: clean(highlight.label),
          at: number(highlight.at),
          previousAt: number(previous.at),
        });
      }
    });

    const panels = array(file.recap.editorialPanels);
    if (!panels.length) {
      packsWithoutPanels.push({
        sourceId: file.id,
        title: file.title,
      });
    }
    panels.forEach((panel, panelIndex) => {
      const panelSurface = `editorialPanels[${panelIndex}]`;
      const panelType = clean(panel.type);
      const groups = array(panel.groups);
      const items = array(panel.items);
      if (
        !clean(panel.id) ||
        !/^(?:ranking|verdict|character)-ledger$/.test(panelType)
      ) {
        addFailure(panelFailures, file, panelSurface, {
          kind: "invalid-human-editorial-panel-identity",
          label: clean(panel.title || panel.id || panelType),
        });
        return;
      }
      const hasExpectedContent =
        panelType === "ranking-ledger"
          ? groups.length > 0
          : panelType === "verdict-ledger"
            ? groups.length > 0 || items.length > 0
            : items.length > 0;
      if (!hasExpectedContent) {
        addFailure(panelFailures, file, panelSurface, {
          kind: "empty-human-editorial-panel",
          label: clean(panel.title || panel.id),
        });
      }
      groups.forEach((group, groupIndex) => {
        const surface =
          `${panelSurface}.groups[${groupIndex}]`;
        const groupItems = array(group.items);
        if (
          typeof group.label !== "string" ||
          !clean(group.label) ||
          !groupItems.length ||
          groupItems.some((item) =>
            typeof item !== "string" || !clean(item)
          )
        ) {
          addFailure(panelFailures, file, surface, {
            kind: "invalid-human-editorial-panel-group",
            label: clean(group.label),
          });
        }
      });
      items.forEach((item, itemIndex) => {
        const surface = `${panelSurface}.items[${itemIndex}]`;
        if (panelType === "verdict-ledger") {
          if (
            typeof item.subject !== "string" ||
            typeof item.verdict !== "string" ||
            !clean(item.subject) ||
            !clean(item.verdict)
          ) {
            addFailure(panelFailures, file, surface, {
              kind: "invalid-human-editorial-verdict",
              label: clean(item.subject),
            });
          }
        } else if (panelType === "character-ledger") {
          if (
            typeof item.character !== "string" ||
            typeof item.label !== "string" ||
            !clean(item.character) ||
            !clean(item.label)
          ) {
            addFailure(panelFailures, file, surface, {
              kind: "invalid-human-editorial-character",
              label: clean(item.character || item.label),
            });
          }
        }
        if (
          panelType === "character-ledger" ||
          item.at != null ||
          item.end != null
        ) {
          const windowFailure = humanEditorialWindowFailure(
            item,
            duration,
            { requirePlayWindow: false },
          );
          if (windowFailure) {
            addFailure(panelFailures, file, surface, {
              ...windowFailure,
              label: clean(item.subject || item.character || item.label),
            });
          }
        }
      });
    });
  });

  return {
    humanFiles,
    storyFailures,
    highlightFailures,
    panelFailures,
    packsWithoutPanels,
  };
}

function titleTopicFailures(files, titleTopicOverrides) {
  const bySource = new Map();
  array(titleTopicOverrides.topics).forEach((topic) => {
    const sourceId = clean(topic.sourceId);
    if (!sourceId) return;
    if (!bySource.has(sourceId)) bySource.set(sourceId, []);
    bySource.get(sourceId).push(topic);
  });
  const failures = [];
  let expectedCount = 0;
  let ordinaryExpectedCount = 0;
  let humanEditorialExpectedCount = 0;
  files.forEach((file) => {
    const expectedTopics = bySource.get(file.id) || [];
    if (file.recap.state !== "ready") return;
    expectedCount += expectedTopics.length;
    if (isHumanEditorialRecap(file.recap)) {
      humanEditorialExpectedCount += expectedTopics.length;
      return;
    }
    ordinaryExpectedCount += expectedTopics.length;
    expectedTopics.forEach((expected) => {
      const expectedFirst = optionalNumber(expected.firstAt);
      const expectedPeak = optionalNumber(expected.peakAt);
      const receipt = matchingTitleReceipt(file.source, expected);
      const topicMap = matchingTopicMap(file.recap, expected);
      const storyEvidence = matchingStoryTopicEvidence(
        file.recap,
        expected,
        receipt,
      );
      const base = {
        sourceId: file.id,
        title: file.title,
        label: clean(expected.label),
        expectedFirstAt: expectedFirst,
        expectedPeakAt: expectedPeak,
      };
      if (!receipt) {
        failures.push({ ...base, kind: "missing-title-topic-receipt" });
      } else {
        if (number(receipt.topicFirstAt) !== number(expectedFirst)) {
          failures.push({
            ...base,
            kind: "receipt-first-at-mismatch",
            actual: number(receipt.topicFirstAt),
          });
        }
        if (
          expectedPeak !== null &&
          number(receipt.topicPeakAt) !== number(expectedPeak)
        ) {
          failures.push({
            ...base,
            kind: "receipt-peak-at-mismatch",
            actual: number(receipt.topicPeakAt),
          });
        }
      }
      if (!topicMap) {
        failures.push({ ...base, kind: "missing-title-topic-map-entry" });
      } else if (number(topicMap.firstAt) !== number(expectedFirst)) {
        failures.push({
          ...base,
          kind: "topic-map-first-at-mismatch",
          actual: number(topicMap.firstAt),
        });
      }
      if (!storyEvidence) {
        failures.push({ ...base, kind: "missing-story-topic-evidence" });
      } else if (
        number(storyEvidence.evidence.firstAt) !== number(expectedFirst)
      ) {
        failures.push({
          ...base,
          kind: "story-evidence-first-at-mismatch",
          segmentIndex: storyEvidence.segmentIndex,
          actual: number(storyEvidence.evidence.firstAt),
        });
      }
      timedTitleClaims(file, expected).forEach((claim) => {
        if (!claim.seconds.includes(number(expectedFirst))) {
          failures.push({
            ...base,
            kind: "public-title-topic-time-mismatch",
            surface: claim.surface,
            expectedClock: claim.expectedClock,
            displayedClocks: claim.clocks,
            text: claim.text,
          });
        }
      });
    });
  });
  return {
    expectedCount,
    ordinaryExpectedCount,
    humanEditorialExpectedCount,
    failures,
  };
}

function audit(files, canonicalCount, titleTopicOverrides, sourceId) {
  const selected = sourceId
    ? files.filter((file) => file.id === sourceId)
    : files;
  if (sourceId && !selected.length) {
    throw new Error(`Unknown canonical source: ${sourceId}`);
  }
  const ready = selected.filter((file) => file.recap.state === "ready");
  const held = selected.filter((file) => file.recap.state === "held");

  const overlappingStoryWindows = [];
  const genericPrimarySubjects = [];
  const sourceTimelinePublicSubjects = [];
  const duplicateAdjacentStorySubjects = [];
  const duplicateRepeatedStorySubjects = [];
  const invalidDisplayedStoryWindows = [];

  ready.forEach((file) => {
    const story = array(file.recap.story).slice().sort((left, right) =>
      number(left.at) - number(right.at) ||
      number(left.ordinal) - number(right.ordinal) ||
      clean(left.id).localeCompare(clean(right.id))
    );
    story.forEach((segment, index) => {
      const subject = storySubject(segment);
      const displayed = displayedStoryWindow(segment);
      const at = displayed.at;
      const end = displayed.end;
      const windowSeconds = end - at;
      if (isGenericHighlightSubject(subject)) {
        genericPrimarySubjects.push({
          sourceId: file.id,
          title: file.title,
          segmentId: clean(segment.id),
          segmentIndex: index,
          subject,
          at,
        });
      }
      if (windowSeconds <= 0) {
        invalidDisplayedStoryWindows.push({
          sourceId: file.id,
          title: file.title,
          segmentId: clean(segment.id),
          segmentIndex: index,
          subject,
          at,
          end,
          windowSeconds,
        });
      }
      const next = story[index + 1];
      const nextDisplayed = next ? displayedStoryWindow(next) : null;
      if (next && end > nextDisplayed.at) {
        overlappingStoryWindows.push({
          sourceId: file.id,
          title: file.title,
          segmentId: clean(segment.id),
          subject,
          at,
          end,
          nextSegmentId: clean(next.id),
          nextSubject: storySubject(next),
          nextAt: nextDisplayed.at,
          overlapSeconds: end - nextDisplayed.at,
        });
      }
      if (
        next &&
        normalize(subject) &&
        normalize(subject) === normalize(storySubject(next))
      ) {
        duplicateAdjacentStorySubjects.push({
          sourceId: file.id,
          title: file.title,
          subject,
          firstSegmentId: clean(segment.id),
          secondSegmentId: clean(next.id),
          firstIndex: index,
          secondIndex: index + 1,
        });
      }
    });
    const subjects = new Map();
    story.forEach((segment, index) => {
      const subject = storySubject(segment);
      const key = normalize(subject);
      if (!key) return;
      if (!subjects.has(key)) subjects.set(key, []);
      subjects.get(key).push({
        segmentId: clean(segment.id),
        index,
        at: number(segment.at),
      });
    });
    subjects.forEach((segments, key) => {
      if (segments.length < 2) return;
      duplicateRepeatedStorySubjects.push({
        sourceId: file.id,
        title: file.title,
        subject: storySubject(story[segments[0].index]) || key,
        segments,
      });
    });
    publicSurfaces(file).forEach((surface) => {
      if (!/\bsource\s+timeline\b/i.test(surface.text)) return;
      sourceTimelinePublicSubjects.push({
        sourceId: file.id,
        title: file.title,
        surface: surface.surface,
        text: surface.text,
      });
    });
  });

  const topicRecapFalseContinuousRanges = [];
  const topicRecapFalseEpisodeNarrative = [];
  const topicRecapFalseHighlightLanguage = [];
  ready.filter((file) => file.recap.tier === "topic-recap").forEach((file) => {
    topicProseSurfaces(file).forEach((surface) => {
      const range = proseMatch(
        file,
        surface,
        "continuous-range",
        [continuousRangePattern],
      );
      if (range) topicRecapFalseContinuousRanges.push(range);
      const narrative = proseMatch(
        file,
        surface,
        "episode-narrative",
        episodeNarrativePatterns,
      );
      if (narrative) topicRecapFalseEpisodeNarrative.push(narrative);
      const highlight = proseMatch(
        file,
        surface,
        "highlight-claim",
        highlightClaimPatterns,
      );
      if (highlight) topicRecapFalseHighlightLanguage.push(highlight);
    });
  });

  const humanEditorialAudit = auditHumanEditorialSurfaces(ready);
  const titleAudit = titleTopicFailures(
    selected,
    titleTopicOverrides,
  );
  const failures = {
    overlappingStoryWindows,
    genericPrimarySubjects,
    sourceTimelinePublicSubjects,
    duplicateAdjacentStorySubjects,
    duplicateRepeatedStorySubjects,
    topicRecapFalseContinuousRanges,
    topicRecapFalseEpisodeNarrative,
    topicRecapFalseHighlightLanguage,
    titleTopicFirstOccurrenceFailures: titleAudit.failures,
    invalidDisplayedStoryWindows,
    invalidHumanEditorialStory:
      humanEditorialAudit.storyFailures,
    invalidHumanEditorialHighlights:
      humanEditorialAudit.highlightFailures,
    invalidHumanEditorialPanels:
      humanEditorialAudit.panelFailures,
  };
  const counts = Object.fromEntries(
    Object.entries(failures).map(([key, values]) => [key, values.length]),
  );
  const gates = {
    noOverlappingStoryWindows: counts.overlappingStoryWindows === 0,
    noGenericHighlightPrimarySubjects: counts.genericPrimarySubjects === 0,
    noSourceTimelinePublicSubjects:
      counts.sourceTimelinePublicSubjects === 0,
    topicRecapProseUsesDiscreteTopicClaims:
      counts.topicRecapFalseContinuousRanges === 0 &&
      counts.topicRecapFalseEpisodeNarrative === 0 &&
      counts.topicRecapFalseHighlightLanguage === 0,
    titleTopicFirstOccurrenceConsistent:
      counts.titleTopicFirstOccurrenceFailures === 0,
    validDisplayedStoryWindows:
      counts.invalidDisplayedStoryWindows === 0,
    validHumanEditorialSurfaces:
      counts.invalidHumanEditorialStory === 0 &&
      counts.invalidHumanEditorialHighlights === 0 &&
      counts.invalidHumanEditorialPanels === 0,
  };
  const advisories = {
    duplicateAdjacentStorySubjects: counts.duplicateAdjacentStorySubjects,
    duplicateRepeatedStorySubjects: counts.duplicateRepeatedStorySubjects,
    humanEditorialPacksWithoutPanels:
      humanEditorialAudit.packsWithoutPanels.length,
  };
  return {
    schema: "shokker-youtube-wiki/episode-semantics-audit/v1",
    generatedAt: new Date().toISOString(),
    runtimeDirectory: demo,
    scope: sourceId
      ? { kind: "source", sourceId }
      : { kind: "canonical-corpus" },
    corpus: {
      canonicalSourcesCompiled: canonicalCount,
      sourcesAudited: selected.length,
      ready: ready.length,
      held: held.length,
      tiers: countBy(selected, (file) => file.recap.tier),
      storySegments: ready.reduce(
        (total, file) => total + array(file.recap.story).length,
        0,
      ),
      topicRecaps: ready.filter((file) => file.recap.tier === "topic-recap")
        .length,
      titleTopicsExpected: titleAudit.expectedCount,
      titleTopicsMachineIdentityAudited:
        titleAudit.ordinaryExpectedCount,
      titleTopicsCoveredByHumanEditorialRead:
        titleAudit.humanEditorialExpectedCount,
      humanEditorialRecaps: humanEditorialAudit.humanFiles.length,
      humanEditorialStorySegments: humanEditorialAudit.humanFiles.reduce(
        (total, file) => total + array(file.recap.story).length,
        0,
      ),
      humanEditorialHighlights: humanEditorialAudit.humanFiles.reduce(
        (total, file) =>
          total + array(file.recap.highlightRunway).length,
        0,
      ),
      humanEditorialPanels: humanEditorialAudit.humanFiles.reduce(
        (total, file) =>
          total + array(file.recap.editorialPanels).length,
        0,
      ),
    },
    counts,
    gates,
    advisories,
    pass: Object.values(gates).every(Boolean),
    failures,
  };
}

function summary(report) {
  return {
    schema: report.schema,
    generatedAt: report.generatedAt,
    scope: report.scope,
    corpus: report.corpus,
    counts: report.counts,
    gates: report.gates,
    pass: report.pass,
  };
}

function humanFailureLines(report, key, limit = 8) {
  const values = report.failures[key] || [];
  if (!values.length) return ["    0  NONE"];
  return values.slice(0, limit).map((failure) => {
    const subject = clean(
      failure.subject ||
      failure.label ||
      failure.nextSubject ||
      failure.kind,
    );
    const detail =
      failure.overlapSeconds != null
        ? ` // ${failure.overlapSeconds}s overlap`
        : failure.windowSeconds != null
          ? ` // ${failure.windowSeconds}s window`
          : failure.surface
            ? ` // ${failure.surface}`
            : "";
    return `  ${failure.sourceId}  ${subject || "semantic failure"}${detail}`;
  });
}

function human(report) {
  const c = report.counts;
  return [
    "WWAM EPISODE SEMANTICS AUDIT",
    `Scope: ${report.scope.kind === "source" ? report.scope.sourceId : "all canonical sources"}`,
    `Compiled: ${report.corpus.canonicalSourcesCompiled} canonical // audited ${report.corpus.sourcesAudited} // ready ${report.corpus.ready} // held ${report.corpus.held}`,
    `Story reels: ${report.corpus.storySegments} // topic recaps ${report.corpus.topicRecaps} // title topics ${report.corpus.titleTopicsExpected}`,
    `Human editorial: ${report.corpus.humanEditorialRecaps} recaps // ${report.corpus.humanEditorialStorySegments} story beats // ${report.corpus.humanEditorialHighlights} highlights // ${report.corpus.humanEditorialPanels} panels`,
    `Title-topic identity: ${report.corpus.titleTopicsMachineIdentityAudited} machine-bound // ${report.corpus.titleTopicsCoveredByHumanEditorialRead} covered by full-tape editorial read`,
    "",
    `Overlapping story windows: ${c.overlappingStoryWindows}`,
    `Generic highlight taxonomy as primary subject: ${c.genericPrimarySubjects}`,
    `Public "Source timeline" subjects: ${c.sourceTimelinePublicSubjects}`,
    `Duplicate adjacent story subjects: ${c.duplicateAdjacentStorySubjects}`,
    `Duplicate repeated story subjects: ${c.duplicateRepeatedStorySubjects}`,
    `Topic-recap false continuous ranges: ${c.topicRecapFalseContinuousRanges}`,
    `Topic-recap false episode narrative: ${c.topicRecapFalseEpisodeNarrative}`,
    `Topic-recap false highlight language: ${c.topicRecapFalseHighlightLanguage}`,
    `Title-topic first-occurrence failures: ${c.titleTopicFirstOccurrenceFailures}`,
    `Invalid displayed story windows: ${c.invalidDisplayedStoryWindows}`,
    `Invalid human-editorial story beats: ${c.invalidHumanEditorialStory}`,
    `Invalid human-editorial highlights: ${c.invalidHumanEditorialHighlights}`,
    `Invalid human-editorial panels: ${c.invalidHumanEditorialPanels}`,
    `Human-editorial packs without optional panels: ${report.advisories.humanEditorialPacksWithoutPanels}`,
    `SEMANTICS GATE: ${report.pass ? "PASS" : "FAIL"}`,
    "",
    "Overlapping story-window examples:",
    ...humanFailureLines(report, "overlappingStoryWindows"),
    "",
    "Generic primary-subject examples:",
    ...humanFailureLines(report, "genericPrimarySubjects"),
    "",
    "Duplicate repeated-subject examples:",
    ...humanFailureLines(report, "duplicateRepeatedStorySubjects"),
    "",
    "Topic-recap prose examples:",
    ...humanFailureLines(report, "topicRecapFalseContinuousRanges", 4),
    ...humanFailureLines(report, "topicRecapFalseEpisodeNarrative", 4),
    ...humanFailureLines(report, "topicRecapFalseHighlightLanguage", 4),
    "",
    "Title-topic consistency examples:",
    ...humanFailureLines(report, "titleTopicFirstOccurrenceFailures"),
    "",
    "Invalid story-window examples:",
    ...humanFailureLines(report, "invalidDisplayedStoryWindows"),
    "",
    "Human-editorial surface examples:",
    ...humanFailureLines(report, "invalidHumanEditorialStory", 4),
    ...humanFailureLines(report, "invalidHumanEditorialHighlights", 4),
    ...humanFailureLines(report, "invalidHumanEditorialPanels", 4),
  ].join("\n") + "\n";
}

const sourceFlag = process.argv.indexOf("--source");
const sourceId = sourceFlag >= 0
  ? clean(process.argv[sourceFlag + 1])
  : "";
if (sourceFlag >= 0 && (!sourceId || sourceId.startsWith("--"))) {
  throw new Error("--source requires one canonical source ID.");
}

const compiled = compile();
const files = compiled.dossier.sources.map((source) => ({
  id: clean(source.id),
  title: clean(source.displayTitle || source.title),
  source,
  recap: record(record(source.showWiki).episodeRecap),
}));
if (process.argv.includes("--dump-recap")) {
  if (!sourceId) {
    throw new Error("--dump-recap requires --source with one canonical source ID.");
  }
  const selected = files.find((file) => file.id === sourceId);
  if (!selected) {
    throw new Error(`Unknown canonical source: ${sourceId}`);
  }
  process.stdout.write(`${JSON.stringify(selected, null, 2)}\n`);
  process.exit(0);
}
const report = audit(
  files,
  files.length,
  compiled.titleTopicOverrides,
  sourceId,
);

if (process.argv.includes("--summary-json")) {
  process.stdout.write(`${JSON.stringify(summary(report), null, 2)}\n`);
} else if (process.argv.includes("--json")) {
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
} else {
  process.stdout.write(human(report));
}

if (process.argv.includes("--check") && !report.pass) {
  process.exitCode = 1;
}
