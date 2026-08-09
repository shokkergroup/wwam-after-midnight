import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const demo = path.join(root, "public", "demo");

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
  "episode-editorial-packs-wave67.js",
  "episode-editorial-packs-wave68.js",
  "episode-editorial-packs-wave69.js",
  "episode-editorial-packs-wave70.js",
  "episode-editorial-packs-wave71.js",
  "episode-editorial-packs-wave72.js",
  "episode-editorial-packs-wave73.js",
  "episode-editorial-packs-wave74.js",
  "episode-editorial-packs-wave75.js",
  "episode-editorial-packs-wave76.js",
  "episode-editorial-packs-wave77.js",
  "episode-editorial-packs-wave78.js",
  "episode-editorial-packs-wave79.js",
  "episode-editorial-packs-wave80.js",
  "episode-editorial-packs-wave81.js",
  "episode-editorial-packs-wave82.js",
  "episode-editorial-packs-wave83.js",
  "episode-editorial-packs-wave84.js",
  "episode-editorial-packs-wave85.js",
  "episode-editorial-packs-wave86.js",
  "episode-editorial-packs-wave87.js",
  "episode-editorial-packs-wave88.js",
  "episode-editorial-packs-wave89.js",
  "episode-editorial-packs-wave90.js",
  "episode-editorial-packs-wave91.js",
  "episode-editorial-packs-wave92.js",
  "episode-editorial-packs-wave93.js",
  "episode-editorial-packs-wave94.js",
  "episode-editorial-packs-wave95.js",
  "episode-editorial-packs-wave96.js",
  "episode-editorial-packs-wave97.js",
  "episode-editorial-packs-wave98.js",
  "episode-editorial-packs-wave99.js",
  "episode-editorial-packs-wave100.js",
  "episode-editorial-packs-wave101.js",
  "episode-editorial-packs-wave102.js",
  "episode-editorial-packs-wave103.js",
  "episode-editorial-packs-wave104.js",
  "episode-editorial-packs-wave105.js",
"episode-editorial-packs-wave106.js",
"episode-editorial-packs-wave107.js",
"episode-editorial-packs-wave108.js",
"episode-editorial-packs-wave109.js",
"episode-editorial-packs-wave110.js",
"episode-editorial-packs-wave111.js",
"episode-editorial-packs-wave112.js",
"episode-editorial-packs-wave113.js",
"episode-editorial-packs-wave114.js",
"episode-editorial-packs-wave115.js",
"episode-editorial-packs-wave116.js",
"episode-editorial-packs-wave117.js",
  "episode-editorial-packs-wave118.js",
  "episode-editorial-packs-wave119.js",
  "episode-editorial-packs-wave120.js",
  "episode-editorial-packs-wave121.js",
  "episode-editorial-packs-wave122.js",
  "episode-editorial-packs-wave123.js",
  "episode-editorial-packs-wave124.js",
  "episode-editorial-packs-wave125.js",
  "episode-editorial-packs-wave126.js",
  "episode-editorial-packs-wave127.js",
  "episode-editorial-packs-wave128.js",
  "episode-editorial-packs-wave129.js",
  "episode-editorial-packs-wave130.js",
  "episode-editorial-packs-wave131.js",
  "episode-editorial-packs-wave132.js",
  "episode-editorial-packs-wave133.js",
  "episode-editorial-packs-wave134.js",
  "episode-editorial-packs-wave135.js",
  "episode-editorial-packs-wave136.js",
  "episode-editorial-packs-wave137.js",
  "episode-editorial-packs-wave138.js",
  "episode-editorial-packs-wave139.js",
  "episode-editorial-packs-wave140.js",
  "episode-editorial-packs-wave141.js",
  "episode-editorial-packs-wave142.js",
  "episode-editorial-packs-wave143.js",
  "episode-editorial-packs-wave144.js",
  "episode-editorial-packs-wave145.js",
  "episode-editorial-packs-wave146.js",
  "episode-editorial-packs-wave147.js",
  "episode-editorial-packs-wave148.js",
  "episode-editorial-packs-wave149.js",
  "episode-editorial-packs-wave150.js",
  "episode-editorial-packs-wave151.js",
  "episode-editorial-packs-wave152.js",
  "episode-editorial-packs-wave153.js",
  "episode-editorial-packs-wave154.js",
  "episode-editorial-packs-wave155.js",
  "episode-editorial-packs-wave156.js",
  "episode-editorial-packs-wave157.js",
  "episode-editorial-packs-wave158.js",
   "episode-editorial-packs-wave159.js",
   "episode-editorial-packs-wave160.js",
   "episode-editorial-packs-wave161.js",
   "episode-editorial-packs-wave162.js",
  "episode-editorial-packs-wave163.js",
  "episode-editorial-packs-wave164.js",
  "episode-editorial-packs-wave165.js",
  "episode-editorial-packs-wave166.js",
  "episode-editorial-packs-wave167.js",
  "episode-editorial-packs-wave168.js",
  "episode-editorial-packs-wave169.js",
  "episode-editorial-packs-wave170.js",
  "episode-editorial-packs-wave171.js",
  "episode-editorial-packs-wave172.js",
  "episode-editorial-packs-wave173.js",
  "episode-editorial-packs-wave174.js",
  "episode-editorial-packs-wave175.js",
  "episode-editorial-packs-wave176.js",
  "episode-editorial-packs-wave177.js",
  "episode-editorial-packs-wave178.js",
  "episode-editorial-packs-wave179.js",
  "episode-editorial-packs-wave180.js",
  "episode-editorial-packs-wave181.js",
  "episode-editorial-packs-wave182.js",
  "episode-editorial-packs-wave183.js",
  "episode-editorial-packs-wave184.js",
  "episode-editorial-packs-wave185.js",
  "episode-editorial-packs-wave186.js",
  "episode-editorial-packs-wave187.js",
  "episode-editorial-packs-wave188.js",
  "episode-editorial-packs-wave189.js",
  "episode-editorial-packs-wave190.js",
  "episode-editorial-packs-wave191.js",
  "episode-editorial-packs-wave192.js",
  "episode-editorial-packs-wave193.js",
  "episode-editorial-packs-wave194.js",
  "episode-editorial-packs-wave195.js",
  "episode-editorial-packs-wave196.js",
  "episode-editorial-packs-wave197.js",
  "episode-editorial-packs-wave198.js",
  "episode-editorial-packs-wave199.js",
  "episode-editorial-packs-wave200.js",
  "episode-editorial-packs-wave201.js",
  "episode-editorial-packs-wave202.js",
  "episode-editorial-packs-wave203.js",
  "episode-editorial-packs-wave204.js",
  "episode-editorial-packs-wave205.js",
  "episode-editorial-packs-wave206.js",
  "episode-editorial-packs-wave207.js",
  "episode-editorial-packs-wave208.js",
  "episode-editorial-packs-wave209.js",
  "episode-editorial-packs-wave210.js",
  "episode-editorial-packs-wave211.js",
  "episode-editorial-packs-wave212.js",
  "episode-editorial-packs-wave213.js",
  "episode-editorial-packs-wave214.js",
  "episode-editorial-packs-wave215.js",
  "episode-editorial-packs-wave216.js",
  "episode-editorial-packs-wave217.js",
  "episode-editorial-packs-wave218.js",
  "episode-editorial-packs-wave219.js",
  "episode-editorial-packs-wave220.js",
  "episode-editorial-packs-wave221.js",
  "episode-editorial-packs-wave222.js",
  "episode-editorial-packs-wave223.js",
  "episode-editorial-packs-wave224.js",
  "episode-editorial-packs-wave225.js",
  "episode-editorial-packs-wave226.js",
  "episode-editorial-packs-wave227.js",
  "episode-editorial-packs-wave228.js",
  "episode-editorial-packs-wave229.js",
  "episode-editorial-packs-wave230.js",
  "episode-editorial-packs-wave231.js",
  "episode-editorial-packs-wave232.js",
  "episode-editorial-packs-wave233.js",
  "episode-editorial-packs-wave234.js",
  "episode-editorial-packs-wave235.js",
  "episode-editorial-packs-wave236.js",
  "episode-editorial-packs-wave237.js",
  "episode-editorial-packs-wave238.js",
  "episode-editorial-packs-wave239.js",
  "episode-editorial-packs-wave240.js",
  "episode-editorial-packs-wave241.js",
  "episode-editorial-packs-wave242.js",
  "episode-editorial-packs-wave243.js",
  "episode-editorial-packs-wave244.js",
  "episode-editorial-packs-wave245.js",
  "episode-editorial-packs-wave246.js",
  "episode-editorial-packs-wave247.js",
  "episode-editorial-packs-wave248.js",
  "episode-editorial-packs-wave249.js",
  "episode-editorial-packs-wave250.js",
  "episode-editorial-packs-wave251.js",
  "episode-editorial-packs-wave252.js",
  "episode-editorial-packs-wave253.js",
  "episode-editorial-packs-wave254.js",
  "episode-editorial-packs-wave255.js",
  "episode-editorial-packs-wave256.js",
  "episode-editorial-packs-wave257.js",
  "episode-editorial-packs-wave258.js",
  "episode-editorial-packs-wave259.js",
  "episode-editorial-packs-wave260.js",
  "episode-editorial-packs-wave261.js",
  "episode-editorial-packs-wave262.js",
  "episode-editorial-packs-wave263.js",
  "episode-editorial-packs-wave264.js",
  "episode-editorial-packs-wave265.js",
  "episode-editorial-packs-wave266.js",
  "episode-editorial-packs-wave267.js",
  "episode-editorial-packs-wave268.js",
  "episode-editorial-packs-wave269.js",
  "episode-editorial-packs-wave270.js",
  "episode-editorial-packs-wave271.js",
  "episode-editorial-packs-wave272.js",
  "episode-editorial-packs-wave273.js",
  "episode-editorial-packs-wave274.js",
  "episode-editorial-packs-wave275.js",
  "episode-editorial-packs-wave276.js",
  "episode-editorial-packs-wave277.js",
  "episode-editorial-packs-wave278.js",
  "episode-editorial-packs-wave279.js",
  "episode-editorial-packs-wave280.js",
  "episode-editorial-packs-wave281.js",
  "episode-editorial-packs-wave282.js",
  "episode-editorial-packs-wave283.js",
  "episode-editorial-packs-wave284.js",
  "episode-editorial-packs-wave285.js",
  "episode-editorial-packs-wave286.js",
  "episode-editorial-packs-wave287.js",
  "episode-editorial-packs-wave288.js",
  "episode-editorial-packs-wave289.js",
  "episode-editorial-packs-wave290.js",
  "episode-editorial-packs-wave291.js",
  "episode-editorial-packs-wave292.js",
  "episode-editorial-packs-wave293.js",
  "episode-editorial-packs-wave294.js",
  "episode-editorial-packs-wave295.js",
  "episode-editorial-packs-wave296.js",
  "episode-editorial-packs-wave297.js",
  "episode-editorial-packs-wave298.js",
  "episode-editorial-packs-wave299.js",
  "episode-editorial-packs-wave300.js",
  "episode-editorial-packs-wave301.js",
  "episode-editorial-packs-wave302.js",
  "episode-editorial-packs-wave303.js",
  "episode-editorial-packs-wave304.js",
  "episode-editorial-packs-wave305.js",
  "episode-editorial-packs-wave306.js",
  "episode-editorial-packs-wave307.js",
  "episode-editorial-packs-wave308.js",
  "episode-editorial-packs-wave309.js",
  "episode-editorial-packs-wave310.js",
  "episode-editorial-packs-wave311.js",
  "episode-editorial-packs-wave312.js",
  "episode-editorial-packs-wave313.js",
  "episode-editorial-packs-wave314.js",
  "episode-editorial-packs-wave315.js",
  "episode-editorial-packs-wave316.js",
  "episode-editorial-packs-wave317.js",
  "episode-editorial-packs-wave318.js",
  "episode-editorial-packs-wave319.js",
  "episode-editorial-packs-wave320.js",
  "episode-editorial-packs-wave321.js",
  "episode-editorial-packs-wave322.js",
  "episode-editorial-packs-wave323.js",
  "episode-editorial-packs-wave324.js",
  "episode-editorial-packs-wave326.js",
  "episode-editorial-packs-wave327.js",
  "episode-editorial-packs-wave328.js",
  "episode-editorial-packs-wave329.js",
  "episode-editorial-packs-wave325.js",
  "episode-editorial-packs-wave330.js",
  "episode-editorial-packs-wave331.js",
  "episode-editorial-packs-wave332.js",
  "episode-editorial-packs-wave333.js",
  "episode-editorial-packs-wave334.js",
  "episode-editorial-packs-wave335.js",
  "episode-editorial-packs-wave336.js",
  "episode-editorial-packs-wave337.js",
  "episode-editorial-packs-wave338.js",
  "episode-editorial-packs-wave339.js",
  "episode-editorial-packs-wave340.js",
  "episode-editorial-packs-wave341.js",
  "episode-editorial-packs-wave342.js",
  "episode-editorial-packs-wave343.js",
  "episode-editorial-packs-wave344.js",
  "episode-editorial-packs-wave345.js",
  "episode-editorial-packs-wave346.js",
  "episode-editorial-packs-wave347.js",
  "episode-editorial-packs-wave348.js",
  "episode-recap-engine.js",
  "wwam-episode-recap-adapter.js",
  "wwam-source-dossier-adapter.js",
];

const genericHighlightLabels = new Set([
  "big laugh",
  "biggest laugh",
  "full send",
  "funny moment",
  "high heat",
  "hot take",
  "out of pocket",
  "reviewed show cut",
  "show checkpoint",
  "soundbyte",
  "soundbyte replay",
  "stinger",
  "take gets nuclear",
  "the room breaks",
  "up in ya",
  "wildest detour",
]);

const categoryOrder = [
  "STRAIGHT TO STEVE'S ASSHOLE",
  "UP IN YA / STINGER",
  "CHARACTER APPEARANCE",
  "SOUNDBYTE / REPLAY",
  "MAJOR TOPIC TURN",
];

const humanEditorialReviewState = "full-tape-human-editorial-read";
const humanEditorialPanelTypes = new Set([
  "ranking-ledger",
  "verdict-ledger",
  "character-ledger",
]);

function array(value) {
  return Array.isArray(value) ? value : [];
}

function number(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function clean(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function topologyKey(value) {
  return clean(value)
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/^(?:topic|character performance|character|moment)\s*:\s*/i, "")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function clock(seconds) {
  const total = Math.max(0, Math.floor(number(seconds)));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor(total % 3600 / 60);
  const remainder = total % 60;
  return hours
    ? `${hours}:${String(minutes).padStart(2, "0")}:${String(remainder).padStart(2, "0")}`
    : `${minutes}:${String(remainder).padStart(2, "0")}`;
}

function runtimeBand(duration) {
  const seconds = number(duration);
  if (seconds < 2700) return "under-45m";
  if (seconds < 5400) return "45m-89m";
  if (seconds < 7200) return "90m-119m";
  if (seconds < 10800) return "2h-3h";
  return "3h-plus";
}

function runtimeHighlightFloor(duration) {
  const seconds = number(duration);
  if (seconds < 2700) return 5;
  if (seconds < 5400) return 8;
  if (seconds < 7200) return 10;
  if (seconds < 10800) return 12;
  return 15;
}

function humanEditorialDepthFloor(duration) {
  const seconds = number(duration);
  if (seconds >= 10800) return { story: 10, highlights: 15 };
  if (seconds >= 7200) return { story: 8, highlights: 10 };
  if (seconds >= 3600) return { story: 5, highlights: 6 };
  return { story: 3, highlights: 4 };
}

function declaresCoordinate(value) {
  return value !== null &&
    value !== undefined &&
    String(value).trim() !== "";
}

function hasCoordinate(value) {
  return declaresCoordinate(value) && Number.isFinite(Number(value));
}

function boundedEditorialWindow(item, duration) {
  if (!hasCoordinate(item?.at) || !hasCoordinate(item?.end)) return false;
  const at = Number(item.at);
  const end = Number(item.end);
  return at >= 0 && end > at && end <= duration;
}

function inspectHumanTimedEntries(values, duration, kind) {
  const entries = array(values);
  const problems = [];
  const windows = new Map();
  const labels = new Map();
  let previousAt = -1;

  entries.forEach((item, index) => {
    const at = Number(item?.at);
    const end = Number(item?.end);
    if (!boundedEditorialWindow(item, duration)) {
      problems.push({
        index,
        problem: "out-of-bounds",
        at: item?.at,
        end: item?.end,
      });
    }
    if (hasCoordinate(item?.at) && at < previousAt) {
      problems.push({
        index,
        problem: "not-chronological",
        at,
        previousAt,
      });
    }
    if (hasCoordinate(item?.at)) previousAt = at;

    if (hasCoordinate(item?.at) && hasCoordinate(item?.end)) {
      const windowKey = `${at}:${end}`;
      if (windows.has(windowKey)) {
        problems.push({
          index,
          problem: "duplicate-window",
          duplicateOf: windows.get(windowKey),
          window: windowKey,
        });
      } else {
        windows.set(windowKey, index);
      }
    }

    const labelKey = topologyKey(item?.label);
    if (!labelKey) {
      problems.push({ index, problem: "missing-label" });
    } else if (labels.has(labelKey)) {
      problems.push({
        index,
        problem: "duplicate-label",
        duplicateOf: labels.get(labelKey),
        label: clean(item?.label),
      });
    } else {
      labels.set(labelKey, index);
    }

    if (kind === "story") {
      if (!clean(item?.body)) {
        problems.push({ index, problem: "missing-body" });
      }
      if (
        clean(item?.evidenceBasis) !== humanEditorialReviewState ||
        clean(item?.narrative?.kind) !== "human-editorial-story"
      ) {
        problems.push({ index, problem: "missing-human-editorial-basis" });
      }
    } else {
      if (!clean(item?.category)) {
        problems.push({ index, problem: "missing-category" });
      }
      if (!clean(item?.excerpt)) {
        problems.push({ index, problem: "missing-excerpt" });
      }
      if (
        clean(item?.kind) !== "human-editorial-highlight" ||
        clean(item?.evidenceBasis) !== humanEditorialReviewState
      ) {
        problems.push({ index, problem: "missing-human-editorial-basis" });
      }
    }
  });

  return {
    count: entries.length,
    problemCount: problems.length,
    problems,
  };
}

function inspectHumanEditorialPanels(values, duration) {
  const panels = array(values);
  const problems = [];
  const ids = new Map();
  let groupCount = 0;
  let itemCount = 0;

  panels.forEach((panel, panelIndex) => {
    const type = clean(panel?.type);
    const id = clean(panel?.id);
    const groups = array(panel?.groups);
    const items = array(panel?.items);

    if (!id) {
      problems.push({ panelIndex, problem: "missing-id" });
    } else if (ids.has(id)) {
      problems.push({
        panelIndex,
        problem: "duplicate-id",
        duplicateOf: ids.get(id),
        id,
      });
    } else {
      ids.set(id, panelIndex);
    }
    if (!humanEditorialPanelTypes.has(type)) {
      problems.push({
        panelIndex,
        problem: "unsupported-type",
        type,
      });
    }
    if (!clean(panel?.title)) {
      problems.push({ panelIndex, problem: "missing-title" });
    }
    if (!groups.length && !items.length) {
      problems.push({ panelIndex, problem: "empty-panel" });
    }
    if (groups.length && type === "character-ledger") {
      problems.push({
        panelIndex,
        problem: "unsupported-grouped-character-ledger",
      });
    }
    if (items.length && type === "ranking-ledger") {
      problems.push({
        panelIndex,
        problem: "unsupported-item-ranking-ledger",
      });
    }

    groups.forEach((group, groupIndex) => {
      groupCount += 1;
      const groupItems = array(group?.items);
      if (!clean(group?.label)) {
        problems.push({
          panelIndex,
          groupIndex,
          problem: "missing-group-label",
        });
      }
      if (
        !groupItems.length ||
        groupItems.some((item) =>
          typeof item !== "string" || !clean(item)
        )
      ) {
        problems.push({
          panelIndex,
          groupIndex,
          problem: "empty-group-items",
        });
      }
    });

    items.forEach((item, itemIndex) => {
      itemCount += 1;
      if (type === "verdict-ledger") {
        if (!clean(item?.subject) || !clean(item?.verdict)) {
          problems.push({
            panelIndex,
            itemIndex,
            problem: "incomplete-verdict-item",
          });
        }
      } else if (type === "character-ledger") {
        if (!clean(item?.character) || !clean(item?.label)) {
          problems.push({
            panelIndex,
            itemIndex,
            problem: "incomplete-character-item",
          });
        }
      }

      const declaresAt = declaresCoordinate(item?.at);
      const declaresEnd = declaresCoordinate(item?.end);
      if (
        (declaresAt || declaresEnd) &&
        !boundedEditorialWindow(item, duration)
      ) {
        problems.push({
          panelIndex,
          itemIndex,
          problem: "out-of-bounds-item-window",
          at: item?.at,
          end: item?.end,
        });
      }
    });
  });

  return {
    count: panels.length,
    groupCount,
    itemCount,
    problemCount: problems.length,
    problems,
  };
}

function receiptKind(receipt) {
  const kind = clean(receipt?.kind).toLowerCase();
  const evidenceType = clean(receipt?.evidenceType).toLowerCase();
  if (kind.includes("topic") || evidenceType.includes("topic")) return "topic";
  if (kind.includes("character") || evidenceType.includes("character")) {
    return "character";
  }
  return "moment";
}

function receiptAt(receipt) {
  return Math.max(0, number(receipt?.at ?? receipt?.t));
}

function cutAt(cut) {
  return Math.max(0, number(cut?.at ?? cut?.t));
}

function validGuideCuts(source) {
  return array(source?.showWiki?.episodeGuide?.cuts).filter((cut) =>
    clean(cut?.id) && number(cut?.end) > cutAt(cut)
  );
}

function storyReceiptKeys(recap) {
  return new Set(array(recap?.story).flatMap((segment) => [
    ...array(segment?.receiptKeys),
    ...array(segment?.hiddenReceiptKeys),
    ...array(segment?.timelineReceiptKeys),
    ...array(segment?.hiddenTimelineReceiptKeys),
    ...array(segment?.timelineReceipts).map((receipt) =>
      receipt?.receiptKey || receipt?.key
    ),
    ...array(segment?.hiddenTimelineReceipts).map((receipt) =>
      receipt?.receiptKey || receipt?.key
    ),
  ]).map(clean).filter(Boolean));
}

function storyGuideCutIds(recap) {
  return new Set(array(recap?.story).flatMap((segment) =>
    array(segment?.guideCutIds)
  ).map(clean).filter(Boolean));
}

function sectionReceiptKeys(recap) {
  return new Set(array(recap?.sections).flatMap((section) =>
    array(section?.receiptKeys)
  ).map(clean).filter(Boolean));
}

function sectionGuideCutIds(recap) {
  return new Set(array(recap?.sections).map((section) =>
    clean(section?.guideCutId)
  ).filter(Boolean));
}

function normalizedText(values) {
  return array(values).flat(Infinity).map(clean).filter(Boolean).join(" ")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function textContainsLabel(text, label) {
  const needle = topologyKey(label);
  if (!needle) return false;
  return ` ${text} `.includes(` ${needle} `);
}

function genericLabel(value) {
  const key = topologyKey(value);
  return genericHighlightLabels.has(key) ||
    /^(?:chapter|reel|runtime|segment|part)\s+\d+$/.test(key) ||
    /^(?:opening|closing|finale|next turn|the next turn)$/.test(key);
}

function laneKeys(source, pattern) {
  return new Set(array(source?.showWiki?.lanes)
    .filter((lane) => pattern.test(
      `${clean(lane?.id)} ${clean(lane?.label)}`,
    ))
    .flatMap((lane) => array(lane?.receiptKeys))
    .map(clean)
    .filter(Boolean));
}

function expectedReceiptCategory(receipt, steveKeys, upInYaKeys) {
  const kind = receiptKind(receipt);
  const key = clean(receipt?.key);
  const label = clean(receipt?.label).toUpperCase();
  if (kind === "character") return "CHARACTER APPEARANCE";
  if (steveKeys.has(key)) return "STRAIGHT TO STEVE'S ASSHOLE";
  if (
    upInYaKeys.has(key) ||
    /UP IN YA|OUT OF POCKET|FULL SEND|STINGER/.test(label)
  ) {
    return "UP IN YA / STINGER";
  }
  if (kind === "moment") return "SOUNDBYTE / REPLAY";
  return "MAJOR TOPIC TURN";
}

function expectedGuideCategory(source, cut) {
  const guide = source?.showWiki?.episodeGuide || {};
  const fanRead = guide?.fanRead || {};
  const cutId = clean(cut?.id);
  if (clean(fanRead?.hated?.cutId) === cutId) {
    return "STRAIGHT TO STEVE'S ASSHOLE";
  }
  if (clean(fanRead?.wildestDetour?.cutId) === cutId) {
    return "UP IN YA / STINGER";
  }
  const topic = topologyKey(cut?.topic);
  const isCharacter = array(guide?.threads).some((thread) =>
    clean(thread?.kind).toLowerCase() === "character" &&
    topologyKey(thread?.name) === topic
  );
  return isCharacter ? "CHARACTER APPEARANCE" : "SOUNDBYTE / REPLAY";
}

function percentile(values, fraction) {
  if (!values.length) return 0;
  const sorted = values.slice().sort((left, right) => left - right);
  return sorted[Math.min(
    sorted.length - 1,
    Math.max(0, Math.floor((sorted.length - 1) * fraction)),
  )];
}

function average(values) {
  return values.length
    ? Math.round(
      values.reduce((total, value) => total + value, 0) / values.length * 10,
    ) / 10
    : 0;
}

function countBy(values, getter) {
  return values.reduce((counts, item) => {
    const key = clean(getter(item)) || "NONE";
    counts[key] = (counts[key] || 0) + 1;
    return counts;
  }, {});
}

function compileCorpus({ withoutArchiveCompletion = false } = {}) {
  const sandbox = { window: {} };
  sandbox.self = sandbox.window;
  vm.createContext(sandbox);
  runtimeFiles
    .filter((file) =>
      file !== "archive-completion.js" ||
      !withoutArchiveCompletion && fs.existsSync(path.join(demo, file))
    )
    .forEach((file) => {
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
      packFingerprint: "fnv1a32:episode-depth-audit",
    },
  });
}

function issue(source, metric, severity, score, message, detail = {}) {
  return {
    sourceId: clean(source?.id),
    title: clean(source?.displayTitle || source?.title),
    duration: number(source?.duration),
    runtime: clock(source?.duration),
    metric,
    severity,
    score,
    message,
    detail,
  };
}

function auditSource(source) {
  const recap = source?.showWiki?.episodeRecap || {};
  const duration = Math.max(1, number(source?.duration));
  const humanEditorial =
    clean(recap?.editorialState) === humanEditorialReviewState;
  const humanFloors = humanEditorial
    ? humanEditorialDepthFloor(duration)
    : { story: 0, highlights: 0 };
  const humanStory = humanEditorial
    ? inspectHumanTimedEntries(recap?.story, duration, "story")
    : { count: 0, problemCount: 0, problems: [] };
  const humanHighlights = humanEditorial
    ? inspectHumanTimedEntries(
      recap?.highlightRunway,
      duration,
      "highlights",
    )
    : { count: 0, problemCount: 0, problems: [] };
  const humanPanels = humanEditorial
    ? inspectHumanEditorialPanels(recap?.editorialPanels, duration)
    : {
      count: 0,
      groupCount: 0,
      itemCount: 0,
      problemCount: 0,
      problems: [],
    };
  const receipts = array(source?.receipts);
  const visibleReceipts = receipts.filter((receipt) =>
    receipt?.showWikiHidden !== true
  );
  const requiredReceipts = visibleReceipts.filter((receipt) =>
    receiptKind(receipt) !== "topic"
  );
  const topicReceipts = visibleReceipts.filter((receipt) =>
    receiptKind(receipt) === "topic"
  );
  const titleReceipts = topicReceipts.filter((receipt) =>
    clean(receipt?.evidenceType) === "caption-title-topic-receipt"
  );
  const guideCuts = validGuideCuts(source);
  const runway = array(recap?.highlightRunway);
  const runwayReceiptKeys = new Set(runway.map((item) =>
    clean(item?.receiptKey)
  ).filter(Boolean));
  const runwayGuideIds = new Set(runway.map((item) =>
    clean(item?.guideCutId)
  ).filter(Boolean));
  const sourceReceiptKeys = new Set(receipts.map((receipt) =>
    clean(receipt?.key)
  ).filter(Boolean));
  const guideCutIds = new Set(guideCuts.map((cut) =>
    clean(cut?.id)
  ).filter(Boolean));
  const storyKeys = storyReceiptKeys(recap);
  const sectionKeys = sectionReceiptKeys(recap);
  const storyGuideIds = storyGuideCutIds(recap);
  const sectionGuideIds = sectionGuideCutIds(recap);
  const surfacedReceiptKeys = new Set([
    ...runwayReceiptKeys,
    ...storyKeys,
    ...sectionKeys,
    ...array(recap?.topicMap).map((topic) => clean(topic?.receiptKey)),
  ].filter(Boolean));
  const surfacedGuideIds = new Set([
    ...runwayGuideIds,
    ...storyGuideIds,
    ...sectionGuideIds,
    ...array(recap?.topicMap).map((topic) => clean(topic?.guideCutId)),
  ].filter(Boolean));
  const steveKeys = laneKeys(
    source,
    /straight[- ]to[- ]steve|steve'?s?\s+asshole/i,
  );
  const upInYaKeys = laneKeys(
    source,
    /up[- ]in[- ]ya|out[- ]of[- ]pocket/i,
  );
  const actualCategories = new Set(runway.map((item) =>
    clean(item?.category)
  ).filter(Boolean));
  const availableCategories = humanEditorial
    ? new Set(actualCategories)
    : new Set([
      ...visibleReceipts.map((receipt) =>
        expectedReceiptCategory(receipt, steveKeys, upInYaKeys)
      ),
      ...guideCuts.map((cut) => expectedGuideCategory(source, cut)),
    ]);
  // Exact topic navigation is still playable source evidence. A "ready" show
  // with ten timestamped topic doors and zero comedy/character candidates
  // must not be excused into a zero-highlight wiki.
  const hasNavigableEvidence =
    visibleReceipts.length > 0 || guideCuts.length > 0;
  const targetFloor = humanEditorial
    ? humanFloors.highlights
    : hasNavigableEvidence
      ? runtimeHighlightFloor(source?.duration)
      : 0;
  const featureCapacity = humanEditorial
    ? runway.length
    : visibleReceipts.length + guideCuts.length;
  const achievableFloor = humanEditorial
    ? targetFloor
    : hasNavigableEvidence
      ? Math.min(targetFloor, featureCapacity)
      : 0;

  const missingRequired = humanEditorial
    ? []
    : requiredReceipts.filter((receipt) =>
      !runwayReceiptKeys.has(clean(receipt?.key))
    );
  const duplicateRunwayKeys = runway.map((item) =>
    clean(item?.receiptKey)
      ? `receipt:${clean(item?.receiptKey)}`
      : clean(item?.guideCutId)
        ? `guide:${clean(item?.guideCutId)}`
        : ""
  ).filter(Boolean);
  const duplicateFeatureCount =
    duplicateRunwayKeys.length - new Set(duplicateRunwayKeys).size;
  const foreignFeatures = humanEditorial
    ? []
    : runway.filter((item) => {
      const receiptKey = clean(item?.receiptKey);
      const guideCutId = clean(item?.guideCutId);
      if (receiptKey) return !sourceReceiptKeys.has(receiptKey);
      if (guideCutId) return !guideCutIds.has(guideCutId);
      return true;
    });

  const recapTopicLabels = array(recap?.topics).map(clean).filter(Boolean);
  const actualTopicKeys = recapTopicLabels.map(topologyKey).filter(Boolean);
  const uniqueActualTopicKeys = new Set(actualTopicKeys);
  const expectedTopicLabels = humanEditorial
    ? []
    : Array.from(new Map(topicReceipts.map((receipt) => [
      topologyKey(receipt?.label),
      clean(receipt?.label),
    ])).entries()).filter(([key]) => key);
  const expectedTopicKeys = new Set(expectedTopicLabels.map(([key]) => key));
  const duplicateTopicDoors =
    actualTopicKeys.length - uniqueActualTopicKeys.size;
  const minimumTopicDoors = Math.min(3, expectedTopicKeys.size);
  const missingTopicDoors = expectedTopicLabels.filter(([key]) =>
    !uniqueActualTopicKeys.has(key)
  );

  const recapText = normalizedText([
    recap?.headline,
    recap?.deck,
    recap?.overview,
    recapTopicLabels,
    array(recap?.story).flatMap((segment) => [
      segment?.label,
      segment?.body,
      segment?.primarySubject,
      segment?.narrative?.primarySubject,
      segment?.narrative?.secondarySubjects,
      segment?.topicLabels,
    ]),
    array(recap?.sections).flatMap((section) => [
      section?.label,
      section?.body,
      section?.anchor,
    ]),
    runway.map((item) => item?.label),
  ]);
  const missingTitleSubjects = humanEditorial
    ? []
    : titleReceipts.filter((receipt) => {
      const key = clean(receipt?.key);
      return !surfacedReceiptKeys.has(key) ||
        !textContainsLabel(recapText, receipt?.label);
    });

  const lateReceiptEvidence = humanEditorial
    ? []
    : visibleReceipts.filter((receipt) =>
      receiptAt(receipt) / duration >= 0.75
    );
  const lateGuideEvidence = humanEditorial
    ? []
    : guideCuts.filter((cut) =>
      cutAt(cut) / duration >= 0.75
    );
  const missingLateReceipts = humanEditorial
    ? []
    : lateReceiptEvidence.filter((receipt) =>
      !surfacedReceiptKeys.has(clean(receipt?.key))
    );
  const missingLateGuideCuts = humanEditorial
    ? []
    : lateGuideEvidence.filter((cut) =>
      !surfacedGuideIds.has(clean(cut?.id))
    );
  const humanPanelTimedItems = humanEditorial
    ? array(recap?.editorialPanels).flatMap((panel) =>
      array(panel?.items).filter((item) =>
        boundedEditorialWindow(item, duration)
      )
    )
    : [];
  const humanLateEvidence = humanEditorial
    ? [
      ...array(recap?.story),
      ...runway,
      ...humanPanelTimedItems,
    ].filter((item) =>
      boundedEditorialWindow(item, duration) &&
      number(item?.at) / duration >= 0.75
    )
    : [];
  const latestSurfaceAt = Math.max(0, ...[
    ...runway.map((item) => number(item?.at)),
    ...array(recap?.story).map((segment) =>
      Math.max(number(segment?.at), number(segment?.anchorAt))
    ),
    ...array(recap?.sections).map((section) => number(section?.at)),
    ...humanPanelTimedItems.map((item) => number(item?.at)),
  ]);
  const latestEligibleAt = humanEditorial
    ? duration * 0.75
    : Math.max(0, ...[
      ...lateReceiptEvidence.map(receiptAt),
      ...lateGuideEvidence.map(cutAt),
    ]);
  const humanLateTailMissing =
    humanEditorial && latestSurfaceAt < duration * 0.75;

  const highlightLabels = runway.map((item) => clean(item?.label))
    .filter(Boolean);
  const genericCount = highlightLabels.filter(genericLabel).length;
  const genericRatio = highlightLabels.length
    ? genericCount / highlightLabels.length
    : 0;
  const labelCounts = countBy(highlightLabels, topologyKey);
  const dominantLabelEntry = Object.entries(labelCounts)
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))[0] ||
      ["", 0];
  const dominantLabelRatio = highlightLabels.length
    ? dominantLabelEntry[1] / highlightLabels.length
    : 0;

  const issues = [];
  if (runway.length < achievableFloor) {
    const deficit = achievableFloor - runway.length;
    issues.push(issue(
      source,
      "highlight-floor",
      "blocker",
      100 + deficit * 12,
      `${runway.length} playable highlights is below the achievable ${achievableFloor}-highlight runtime floor.`,
      {
        runtimeBand: runtimeBand(duration),
        targetFloor,
        achievableFloor,
        actual: runway.length,
        featureCapacity,
        deficit,
      },
    ));
  }
  if (humanEditorial && humanStory.count < humanFloors.story) {
    const deficit = humanFloors.story - humanStory.count;
    issues.push(issue(
      source,
      "human-story-floor",
      "blocker",
      140 + deficit * 15,
      `${humanStory.count} human story chapters is below the ` +
        `${humanFloors.story}-chapter editorial floor.`,
      {
        runtimeBand: runtimeBand(duration),
        required: humanFloors.story,
        actual: humanStory.count,
        deficit,
      },
    ));
  }
  if (
    humanEditorial &&
    recap?.caseFile?.humanEditorialRead !== true
  ) {
    issues.push(issue(
      source,
      "human-editorial-marker",
      "blocker",
      220,
      "The full-tape editorial recap is missing its explicit human-read marker.",
    ));
  }
  if (humanEditorial && humanStory.problemCount) {
    issues.push(issue(
      source,
      "human-story-structure",
      "blocker",
      190 + humanStory.problemCount * 12,
      "Human story chapters contain invalid windows, repeated identities, " +
        "missing copy, or non-editorial evidence.",
      {
        problemCount: humanStory.problemCount,
        problems: humanStory.problems.slice(0, 25),
      },
    ));
  }
  if (humanEditorial && humanHighlights.problemCount) {
    issues.push(issue(
      source,
      "human-highlight-structure",
      "blocker",
      190 + humanHighlights.problemCount * 12,
      "Human highlights contain invalid windows, repeated identities, " +
        "missing copy, or non-editorial evidence.",
      {
        problemCount: humanHighlights.problemCount,
        problems: humanHighlights.problems.slice(0, 25),
      },
    ));
  }
  if (humanEditorial && humanPanels.problemCount) {
    issues.push(issue(
      source,
      "human-editorial-panels",
      "blocker",
      185 + humanPanels.problemCount * 12,
      "Human editorial panels contain unsupported, empty, incomplete, or " +
        "out-of-bounds content.",
      {
        panelCount: humanPanels.count,
        problemCount: humanPanels.problemCount,
        problems: humanPanels.problems.slice(0, 25),
      },
    ));
  }
  if (missingRequired.length) {
    issues.push(issue(
      source,
      "uncapped-carry-through",
      "blocker",
      180 + missingRequired.length * 15,
      `${missingRequired.length} registered moment/character receipt(s) were dropped from the playable runway.`,
      {
        registeredMomentAndCharacterCount: requiredReceipts.length,
        actualRunwayCount: runway.length,
        missing: missingRequired.slice(0, 25).map((receipt) => ({
          key: clean(receipt?.key),
          at: receiptAt(receipt),
          label: clean(receipt?.label),
          kind: receiptKind(receipt),
        })),
      },
    ));
  }
  if (foreignFeatures.length || duplicateFeatureCount) {
    issues.push(issue(
      source,
      "runway-identity",
      "blocker",
      170 + foreignFeatures.length * 15 + duplicateFeatureCount * 10,
      "The playable runway contains foreign, unkeyed, or duplicate feature identities.",
      {
        foreign: foreignFeatures.slice(0, 25).map((item) => ({
          receiptKey: clean(item?.receiptKey),
          guideCutId: clean(item?.guideCutId),
          at: number(item?.at),
          label: clean(item?.label),
        })),
        duplicateFeatureCount,
      },
    ));
  }

  const categoryFloor = Math.min(
    3,
    availableCategories.size,
    runway.length,
  );
  if (
    runway.length >= 8 &&
    categoryFloor >= 2 &&
    actualCategories.size < categoryFloor
  ) {
    issues.push(issue(
      source,
      "category-diversity",
      actualCategories.size < 2 ? "blocker" : "advisory",
      95 + (categoryFloor - actualCategories.size) * 20,
      `${actualCategories.size} highlight category lane(s) surface despite ${availableCategories.size} evidence-backed lane(s) being available.`,
      {
        requiredDiversity: categoryFloor,
        actualCategories: Array.from(actualCategories).sort(),
        availableCategories: categoryOrder.filter((category) =>
          availableCategories.has(category)
        ),
      },
    ));
  }

  if (humanLateTailMissing) {
    issues.push(issue(
      source,
      "late-tail-coverage",
      "blocker",
      180,
      "The full-tape human story, highlights, and timed editorial panel rows " +
        "do not reach the final quarter of the source.",
      {
        requiredAt: duration * 0.75,
        requiredClock: clock(duration * 0.75),
        latestSurfaceAt,
        latestSurfaceClock: clock(latestSurfaceAt),
      },
    ));
  } else if (
    !humanEditorial &&
    (missingLateReceipts.length || missingLateGuideCuts.length)
  ) {
    issues.push(issue(
      source,
      "late-tail-coverage",
      "blocker",
      160 + (missingLateReceipts.length + missingLateGuideCuts.length) * 12,
      "Source-backed evidence from the final quarter is missing from the public recap structures.",
      {
        latestEligibleAt,
        latestEligibleClock: clock(latestEligibleAt),
        latestSurfaceAt,
        latestSurfaceClock: clock(latestSurfaceAt),
        missingReceipts: missingLateReceipts.slice(0, 25).map((receipt) => ({
          key: clean(receipt?.key),
          at: receiptAt(receipt),
          label: clean(receipt?.label),
        })),
        missingGuideCuts: missingLateGuideCuts.slice(0, 25).map((cut) => ({
          id: clean(cut?.id),
          at: cutAt(cut),
          topic: clean(cut?.topic),
        })),
      },
    ));
  } else if (
    !humanEditorial &&
    duration >= 5400 &&
    latestEligibleAt >= duration * 0.75 &&
    latestSurfaceAt < duration * 0.7
  ) {
    issues.push(issue(
      source,
      "late-tail-coverage",
      "advisory",
      70,
      "Late evidence is structurally retained, but the visible anchor map appears front-loaded.",
      {
        latestEligibleAt,
        latestEligibleClock: clock(latestEligibleAt),
        latestSurfaceAt,
        latestSurfaceClock: clock(latestSurfaceAt),
      },
    ));
  }

  if (missingTitleSubjects.length) {
    issues.push(issue(
      source,
      "title-subject-presence",
      "blocker",
      210 + missingTitleSubjects.length * 20,
      "A caption-confirmed title subject is absent from the visible recap or its source-bound structure.",
      {
        missing: missingTitleSubjects.map((receipt) => ({
          key: clean(receipt?.key),
          at: receiptAt(receipt),
          label: clean(receipt?.label),
          structurallySurfaced: surfacedReceiptKeys.has(clean(receipt?.key)),
          textPresent: textContainsLabel(recapText, receipt?.label),
        })),
      },
    ));
  }

  if (duplicateTopicDoors) {
    issues.push(issue(
      source,
      "unique-topic-doors",
      "blocker",
      145 + duplicateTopicDoors * 12,
      `${duplicateTopicDoors} duplicate visible topic door(s) collapse navigation choices.`,
      {
        actual: recapTopicLabels,
        duplicateCount: duplicateTopicDoors,
      },
    ));
  }
  if (uniqueActualTopicKeys.size < minimumTopicDoors) {
    issues.push(issue(
      source,
      "unique-topic-doors",
      "blocker",
      135 + (minimumTopicDoors - uniqueActualTopicKeys.size) * 18,
      `${uniqueActualTopicKeys.size} unique topic door(s) surface despite ${expectedTopicKeys.size} source-backed topic(s).`,
      {
        minimumTopicDoors,
        expectedTopicCount: expectedTopicKeys.size,
        actualTopicCount: uniqueActualTopicKeys.size,
        missingTopics: missingTopicDoors.slice(0, 25).map((entry) => entry[1]),
      },
    ));
  } else if (
    expectedTopicKeys.size >= 6 &&
    uniqueActualTopicKeys.size / expectedTopicKeys.size < 0.5
  ) {
    issues.push(issue(
      source,
      "unique-topic-doors",
      "advisory",
      60 + Math.round(
        (1 - uniqueActualTopicKeys.size / expectedTopicKeys.size) * 40,
      ),
      "Fewer than half of the distinct registered topics are exposed as direct topic doors.",
      {
        expectedTopicCount: expectedTopicKeys.size,
        actualTopicCount: uniqueActualTopicKeys.size,
        missingTopics: missingTopicDoors.slice(0, 25).map((entry) => entry[1]),
      },
    ));
  }

  if (
    highlightLabels.length >= 8 &&
    genericRatio >= 0.9 &&
    dominantLabelRatio >= 0.65 &&
    expectedTopicKeys.size >= 3
  ) {
    issues.push(issue(
      source,
      "generic-label-dominance",
      "blocker",
      125 + Math.round(genericRatio * 50 + dominantLabelRatio * 30),
      "The highlight runway is overwhelmingly generic and dominated by one repeated label despite richer topic evidence.",
      {
        highlightCount: highlightLabels.length,
        genericCount,
        genericPercent: Math.round(genericRatio * 100),
        dominantLabel: dominantLabelEntry[0],
        dominantLabelCount: dominantLabelEntry[1],
        dominantLabelPercent: Math.round(dominantLabelRatio * 100),
        uniqueTopicDoors: uniqueActualTopicKeys.size,
      },
    ));
  } else if (
    highlightLabels.length >= 6 &&
    (genericRatio >= 0.7 || dominantLabelRatio >= 0.5)
  ) {
    issues.push(issue(
      source,
      "generic-label-dominance",
      "advisory",
      55 + Math.round(Math.max(genericRatio, dominantLabelRatio) * 40),
      "Generic or repeated highlight labels dominate this show and merit an editorial naming pass.",
      {
        highlightCount: highlightLabels.length,
        genericCount,
        genericPercent: Math.round(genericRatio * 100),
        dominantLabel: dominantLabelEntry[0],
        dominantLabelCount: dominantLabelEntry[1],
        dominantLabelPercent: Math.round(dominantLabelRatio * 100),
      },
    ));
  }

  return {
    sourceId: clean(source?.id),
    title: clean(source?.displayTitle || source?.title),
    headline: clean(recap?.headline),
    date: clean(source?.date),
    duration,
    runtime: clock(duration),
    runtimeBand: runtimeBand(duration),
    recapState: clean(recap?.state),
    editorialState: clean(recap?.editorialState),
    highlight: {
      targetFloor,
      achievableFloor,
      featureCapacity,
      actual: runway.length,
      registeredMomentsAndCharacters: humanEditorial
        ? 0
        : requiredReceipts.length,
      missingRegisteredMomentsAndCharacters: missingRequired.length,
      overFloor: Math.max(0, runway.length - achievableFloor),
      uncapped: runway.length > targetFloor,
    },
    categories: {
      available: Array.from(availableCategories).sort(),
      actual: Array.from(actualCategories).sort(),
      requiredDiversity: categoryFloor,
    },
    lateTail: {
      availableEvidence: humanEditorial
        ? humanLateEvidence.length
        : lateReceiptEvidence.length + lateGuideEvidence.length,
      missingEvidence: humanEditorial
        ? Number(humanLateTailMissing)
        : missingLateReceipts.length + missingLateGuideCuts.length,
      latestEligibleAt,
      latestSurfaceAt,
      closingPhaseCovered:
        recap?.caseFile?.closingPhaseCovered === true ||
        humanEditorial && !humanLateTailMissing,
    },
    titleSubjects: {
      registered: humanEditorial
        ? []
        : titleReceipts.map((receipt) => clean(receipt?.label)),
      missing: missingTitleSubjects.map((receipt) => clean(receipt?.label)),
    },
    topicDoors: {
      registeredUnique: expectedTopicKeys.size,
      visibleUnique: uniqueActualTopicKeys.size,
      duplicateCount: duplicateTopicDoors,
      missingCount: missingTopicDoors.length,
    },
    labels: {
      highlightCount: highlightLabels.length,
      genericCount,
      genericPercent: Math.round(genericRatio * 100),
      dominantLabel: dominantLabelEntry[0],
      dominantLabelCount: dominantLabelEntry[1],
      dominantLabelPercent: Math.round(dominantLabelRatio * 100),
    },
    humanEditorial: {
      active: humanEditorial,
      markerPresent: recap?.caseFile?.humanEditorialRead === true,
      story: {
        required: humanFloors.story,
        actual: humanStory.count,
        problemCount: humanEditorial ? humanStory.problemCount : 0,
      },
      highlights: {
        required: humanFloors.highlights,
        actual: humanEditorial ? humanHighlights.count : 0,
        problemCount: humanEditorial ? humanHighlights.problemCount : 0,
      },
      panels: {
        actual: humanEditorial ? humanPanels.count : 0,
        groups: humanEditorial ? humanPanels.groupCount : 0,
        items: humanEditorial ? humanPanels.itemCount : 0,
        problemCount: humanEditorial ? humanPanels.problemCount : 0,
      },
    },
    issues,
  };
}

export function auditEpisodeDepth({
  withoutArchiveCompletion = false,
  sourceId = "",
} = {}) {
  const compiled = compileCorpus({ withoutArchiveCompletion });
  const allSources = array(compiled?.sources);
  const readySources = allSources.filter((source) =>
    clean(source?.showWiki?.episodeRecap?.state) === "ready"
  );
  const selected = sourceId
    ? readySources.filter((source) => clean(source?.id) === clean(sourceId))
    : readySources;
  if (sourceId && !selected.length) {
    throw new Error(`Unknown or non-ready canonical source: ${sourceId}`);
  }
  const shows = selected.map(auditSource);
  const issues = shows.flatMap((show) => show.issues).sort((left, right) =>
    (left.severity === right.severity
      ? 0
      : left.severity === "blocker"
        ? -1
        : 1) ||
    right.score - left.score ||
    left.sourceId.localeCompare(right.sourceId) ||
    left.metric.localeCompare(right.metric)
  );
  const blockers = issues.filter((item) => item.severity === "blocker");
  const advisories = issues.filter((item) => item.severity === "advisory");
  const floorFailures = shows.filter((show) =>
    show.highlight.actual < show.highlight.achievableFloor
  );
  const carryThroughFailures = shows.filter((show) =>
    show.highlight.missingRegisteredMomentsAndCharacters > 0
  );
  const categoryFailures = shows.filter((show) =>
    show.highlight.actual >= 8 &&
    show.categories.actual.length < show.categories.requiredDiversity
  );
  const lateTailFailures = shows.filter((show) =>
    show.lateTail.missingEvidence > 0
  );
  const titleSubjectFailures = shows.filter((show) =>
    show.titleSubjects.missing.length > 0
  );
  const humanEditorialShows = shows.filter((show) =>
    show.humanEditorial.active
  );
  const humanStoryFailures = humanEditorialShows.filter((show) =>
    show.humanEditorial.story.actual < show.humanEditorial.story.required
  );
  const humanIntegrityMetrics = new Set([
    "human-editorial-marker",
    "human-story-structure",
    "human-highlight-structure",
    "human-editorial-panels",
  ]);
  const humanIntegrityBlockers = blockers.filter((item) =>
    humanIntegrityMetrics.has(item.metric)
  );
  const uniqueTopicDoorFailures = shows.filter((show) =>
    show.topicDoors.duplicateCount > 0 ||
    show.topicDoors.visibleUnique < Math.min(3, show.topicDoors.registeredUnique)
  );
  const genericBlockers = blockers.filter((item) =>
    item.metric === "generic-label-dominance"
  );
  const categoryBlockers = blockers.filter((item) =>
    item.metric === "category-diversity"
  );
  const highlightCounts = shows.map((show) => show.highlight.actual);
  const headlineGroups = new Map();
  shows.forEach((show) => {
    const key = clean(show.headline);
    if (!key) return;
    if (!headlineGroups.has(key)) headlineGroups.set(key, []);
    headlineGroups.get(key).push(show);
  });
  const repeatedHeadlines = Array.from(headlineGroups.entries())
    .filter(([, group]) => group.length > 1)
    .map(([headline, group]) => ({
      headline,
      sourceIds: group.map((show) => show.sourceId),
      titles: group.map((show) => show.title),
    }));
  const unexplainedHeadlineCollisions = repeatedHeadlines.filter((group) =>
    new Set(group.titles.map((title) => topologyKey(title))).size > 1
  );

  const gates = {
    runtimeHighlightFloorsPass: floorFailures.length === 0,
    uncappedMomentCharacterCarryThroughPass:
      carryThroughFailures.length === 0,
    categoryDiversityPass: categoryBlockers.length === 0,
    lateTailCoveragePass: lateTailFailures.length === 0,
    titleSubjectPresencePass: titleSubjectFailures.length === 0,
    uniqueTopicDoorsPass: uniqueTopicDoorFailures.length === 0,
    noGenericLabelBlockers: genericBlockers.length === 0,
    humanEditorialStoryDepthPass: humanStoryFailures.length === 0,
    humanEditorialIntegrityPass: humanIntegrityBlockers.length === 0,
    uniqueEpisodeHeadlinesPass: unexplainedHeadlineCollisions.length === 0,
  };
  const summary = {
    schema: "wwam-episode-depth-audit-summary/v1",
    generatedAt: new Date().toISOString(),
    corpus: {
      canonicalSources: allSources.length,
      readySources: readySources.length,
      heldSources: allSources.length - readySources.length,
      auditedReadySources: shows.length,
      runtimeBands: countBy(shows, (show) => show.runtimeBand),
    },
    highlightDepth: {
      total: highlightCounts.reduce((total, value) => total + value, 0),
      average: average(highlightCounts),
      minimum: highlightCounts.length ? Math.min(...highlightCounts) : 0,
      p25: percentile(highlightCounts, 0.25),
      median: percentile(highlightCounts, 0.5),
      p75: percentile(highlightCounts, 0.75),
      maximum: highlightCounts.length ? Math.max(...highlightCounts) : 0,
      showsOver15: shows.filter((show) => show.highlight.actual > 15).length,
      showsOver20: shows.filter((show) => show.highlight.actual > 20).length,
      floorFailures: floorFailures.length,
      carryThroughFailures: carryThroughFailures.length,
    },
    categoryDiversity: {
      failures: categoryFailures.length,
      averageVisibleCategories: average(
        shows.map((show) => show.categories.actual.length),
      ),
    },
    lateTailCoverage: {
      showsWithLateEvidence: shows.filter((show) =>
        show.lateTail.availableEvidence > 0
      ).length,
      failures: lateTailFailures.length,
    },
    titleSubjects: {
      registered: shows.reduce(
        (total, show) => total + show.titleSubjects.registered.length,
        0,
      ),
      failures: titleSubjectFailures.length,
    },
    topicDoors: {
      averageVisibleUnique: average(
        shows.map((show) => show.topicDoors.visibleUnique),
      ),
      failures: uniqueTopicDoorFailures.length,
    },
    genericLabels: {
      blockerShows: genericBlockers.length,
      advisoryShows: advisories.filter((item) =>
        item.metric === "generic-label-dominance"
      ).length,
      averagePercent: average(
        shows.map((show) => show.labels.genericPercent),
      ),
    },
    headlineUniqueness: {
      populated: headlineGroups.size,
      repeatedGroups: repeatedHeadlines.length,
      collisions: repeatedHeadlines,
      unexplainedCollisions: unexplainedHeadlineCollisions,
    },
    humanEditorial: {
      shows: humanEditorialShows.length,
      storyChapters: humanEditorialShows.reduce(
        (total, show) => total + show.humanEditorial.story.actual,
        0,
      ),
      highlights: humanEditorialShows.reduce(
        (total, show) => total + show.humanEditorial.highlights.actual,
        0,
      ),
      panels: humanEditorialShows.reduce(
        (total, show) => total + show.humanEditorial.panels.actual,
        0,
      ),
      panelGroups: humanEditorialShows.reduce(
        (total, show) => total + show.humanEditorial.panels.groups,
        0,
      ),
      panelItems: humanEditorialShows.reduce(
        (total, show) => total + show.humanEditorial.panels.items,
        0,
      ),
      storyFloorFailures: humanStoryFailures.length,
      integrityBlockers: humanIntegrityBlockers.length,
    },
    issues: {
      blockers: blockers.length,
      advisories: advisories.length,
      byMetric: countBy(issues, (item) =>
        `${item.severity}:${item.metric}`
      ),
      topBlockers: blockers.slice(0, 20).map((item) => ({
        sourceId: item.sourceId,
        metric: item.metric,
        score: item.score,
      })),
    },
    gates,
    pass: Object.values(gates).every(Boolean),
  };

  return {
    schema: "wwam-episode-depth-audit/v1",
    summary,
    shows,
    rankedIssues: issues,
  };
}

function printHuman(report) {
  const summary = report.summary;
  const ranked = report.rankedIssues;
  const lines = [
    "WWAM ALL-CORPUS EPISODE DEPTH AUDIT",
    `Sources: ${summary.corpus.canonicalSources} canonical // ${summary.corpus.readySources} ready // ${summary.corpus.heldSources} held // ${summary.corpus.auditedReadySources} audited`,
    `Highlights: ${summary.highlightDepth.total} total // ${summary.highlightDepth.average} average // ${summary.highlightDepth.minimum}-${summary.highlightDepth.maximum} range // p25 ${summary.highlightDepth.p25} // median ${summary.highlightDepth.median} // p75 ${summary.highlightDepth.p75}`,
    `Uncapped depth: ${summary.highlightDepth.showsOver15} shows over 15 // ${summary.highlightDepth.showsOver20} shows over 20`,
    `Runtime floors: ${summary.highlightDepth.floorFailures} failures`,
    `Moment/character carry-through: ${summary.highlightDepth.carryThroughFailures} failures`,
    `Category diversity: ${summary.categoryDiversity.failures} failures // ${summary.categoryDiversity.averageVisibleCategories} average visible lanes`,
    `Late tail: ${summary.lateTailCoverage.showsWithLateEvidence} shows with final-quarter evidence // ${summary.lateTailCoverage.failures} failures`,
    `Title subjects: ${summary.titleSubjects.registered} registered // ${summary.titleSubjects.failures} failures`,
    `Topic doors: ${summary.topicDoors.averageVisibleUnique} average unique // ${summary.topicDoors.failures} failures`,
    `Generic labels: ${summary.genericLabels.blockerShows} blockers // ${summary.genericLabels.advisoryShows} advisories // ${summary.genericLabels.averagePercent}% corpus average`,
    `Episode headlines: ${summary.headlineUniqueness.populated} populated // ${summary.headlineUniqueness.repeatedGroups} repeated groups`,
    `Human editorial: ${summary.humanEditorial.shows} shows // ${summary.humanEditorial.storyChapters} story chapters // ${summary.humanEditorial.highlights} highlights // ${summary.humanEditorial.panels} panels (${summary.humanEditorial.panelGroups} groups + ${summary.humanEditorial.panelItems} items) // ${summary.humanEditorial.storyFloorFailures} story-floor failures // ${summary.humanEditorial.integrityBlockers} integrity blockers`,
    `Issues: ${summary.issues.blockers} blockers // ${summary.issues.advisories} advisories`,
    `DEPTH RELEASE GATE: ${summary.pass ? "PASS" : "FAIL"}`,
    "",
    "RANKED DEPTH ISSUES",
  ];
  if (!ranked.length) {
    lines.push("    0  NONE");
  } else {
    ranked.slice(0, 60).forEach((item, index) => {
      lines.push(
        `${String(index + 1).padStart(3)}  ${item.severity.toUpperCase().padEnd(8)} ` +
        `${String(item.score).padStart(3)}  ${item.sourceId}  ${item.metric}`,
      );
      lines.push(`     ${item.runtime} // ${item.title}`);
      lines.push(`     ${item.message}`);
    });
  }
  lines.push(
    "",
    `MACHINE_SUMMARY ${JSON.stringify(summary)}`,
  );
  process.stdout.write(`${lines.join("\n")}\n`);
}

function optionValue(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? clean(process.argv[index + 1]) : "";
}

const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : "";
if (invokedPath === fileURLToPath(import.meta.url)) {
  const report = auditEpisodeDepth({
    withoutArchiveCompletion: process.argv.includes(
      "--without-archive-completion",
    ),
    sourceId: optionValue("--source"),
  });
  if (process.argv.includes("--json")) {
    process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  } else if (process.argv.includes("--summary-json")) {
    process.stdout.write(`${JSON.stringify(report.summary, null, 2)}\n`);
  } else {
    printHuman(report);
  }
  if (process.argv.includes("--check") && !report.summary.pass) {
    process.exitCode = 1;
  }
}
