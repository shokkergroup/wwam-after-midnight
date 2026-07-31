import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");
const captionsDir = path.join(root, "source-cache", "captions");
const metadataDir = path.join(root, "source-cache", "metadata");
const outputPath = path.join(root, "public", "demo", "wwam-fam-index.js");

/*
 * This is deliberately a conservative public roster. A name enters the FAM
 * index only when it has a stable, channel-native public display name and
 * enough exact-name readouts to be useful. Similar ASR spellings are NOT
 * silently merged. Creator confirmation can add aliases later.
 */
const roster = [
  {
    id: "michael-parten",
    displayName: "Michael Parten",
    publicHandle: "@MichaelParten1",
    youtubeChannelId: "UCSB6mfJpDk3EKgoI_SVZhug",
    aliases: ["Michael Parten", "Michael Parton", "Michael Barton"],
    honor: "THE MAILBAG'S FINAL BOSS",
    tagline: "If there is a chat lane, Michael has probably found it.",
    nameEvidenceState: "live-chat-channel-id-resolved",
    auditObservedShows: 244,
    verifiedReplaySample: {
      label: "FIVE-SHOW LIVE-CHAT REPLAY SAMPLE",
      sampleSourceIds: [
        "2en5C2sNAN8",
        "ZyO2O4olq9U",
        "0_K7wUhtMLk",
        "-31V7Dbyyqs",
        "LV2rmwEA0w4",
      ],
      showsPresent: 5,
      totalSampleShows: 5,
      chatItems: 545,
      paidMessages: 25,
      paidUsd: 107,
      boundary: "Verified inside these five sampled replay files only; never a lifetime total.",
    },
  },
  {
    id: "lee-the-machine-bowers",
    displayName: 'Lee "The Machine" Bowers',
    publicHandle: "@LeeTheMachineBowers",
    youtubeChannelId: "UCuS6ICxtZ2JSdvhHObTsOhQ",
    aliases: [
      "Lee the Machine Bowers",
      "Lee the fucking Machine Bowers",
      "Lee the Machine",
      "Lee Bowers",
    ],
    honor: "THE MACHINE DOESN'T MISS A SHIFT",
    tagline: "The name that can turn a Superchat read into a full character incident.",
    nameEvidenceState: "live-chat-channel-id-resolved",
    auditObservedShows: 79,
    verifiedReplaySample: {
      label: "FIVE-SHOW LIVE-CHAT REPLAY SAMPLE",
      sampleSourceIds: [
        "2en5C2sNAN8",
        "ZyO2O4olq9U",
        "0_K7wUhtMLk",
        "-31V7Dbyyqs",
        "LV2rmwEA0w4",
      ],
      showsPresent: 4,
      totalSampleShows: 5,
      chatItems: 32,
      paidMessages: 11,
      paidUsd: 494.94,
      boundary: "Verified inside these five sampled replay files only; never a lifetime total.",
    },
  },
  {
    id: "robin-barker",
    displayName: "Robin Barker",
    aliases: ["Robin Barker"],
    honor: "THE ROOM REGULAR",
    tagline: "A repeat name in the live-room roll call.",
    nameEvidenceState: "caption-observed-creator-confirmation-open",
    publicHandle: "@robinbarker5407",
    auditObservedShows: 135,
  },
  {
    id: "joe-valentine",
    displayName: "Joe Valentine",
    aliases: ["Joe Valentine"],
    honor: "THE LATE-NIGHT VALENTINE",
    tagline: "A familiar signature in the chat-read archive.",
    nameEvidenceState: "caption-observed-creator-confirmation-open",
  },
  {
    id: "dan-murphy",
    displayName: "Dan Murphy",
    aliases: ["Dan Murphy"],
    honor: "THE FREQUENT FLYER",
    tagline: "Keeps turning up in source-linked room reads.",
    nameEvidenceState: "caption-observed-creator-confirmation-open",
  },
  {
    id: "byron-hansen",
    displayName: "Byron Hansen",
    aliases: ["Byron Hansen"],
    honor: "THE REPEAT OFFENDER",
    tagline: "A recurring public name in the livestream tape.",
    nameEvidenceState: "caption-observed-creator-confirmation-open",
  },
  {
    id: "stacy-james",
    displayName: "Stacy James",
    aliases: ["Stacy James"],
    honor: "THE CHAT STAPLE",
    tagline: "One of the names the automatic-caption archive keeps hearing.",
    nameEvidenceState: "caption-observed-creator-confirmation-open",
    publicHandle: "@TheStacyJamesShow",
    auditObservedShows: 71,
  },
  {
    id: "daniel-torres",
    displayName: "Daniel Torres",
    aliases: ["Daniel Torres"],
    honor: "THE NIGHT-SHIFT REGULAR",
    tagline: "A repeat room read with playable receipts.",
    nameEvidenceState: "caption-observed-creator-confirmation-open",
    publicHandle: "@DanielTorres_999",
    auditObservedShows: 46,
  },
  {
    id: "courtney-reed",
    displayName: "Courtney Reed",
    aliases: ["Courtney Reed"],
    honor: "THE ROOM READER",
    tagline: "A familiar name across multiple WWAM nights.",
    nameEvidenceState: "caption-observed-creator-confirmation-open",
  },
  {
    id: "cody-buchanan",
    displayName: "Cody Buchanan",
    aliases: ["Cody Buchanan"],
    honor: "THE ROLL-CALL RETURN",
    tagline: "Keeps getting another timestamp in the room ledger.",
    nameEvidenceState: "caption-observed-creator-confirmation-open",
  },
  {
    id: "iron-wolf",
    displayName: "Iron Wolf",
    aliases: ["Iron Wolf"],
    honor: "THE HANDLE WITH TEETH",
    tagline: "A public handle built for a horror livestream.",
    nameEvidenceState: "caption-observed-public-handle",
    publicHandle: "@IronWolf277",
    auditObservedShows: 54,
  },
  {
    id: "luke-weber",
    displayName: "Luke Weber",
    aliases: ["Luke Weber"],
    honor: "THE DEEP-BENCH REGULAR",
    tagline: "A repeat chat-read name in the indexed tape.",
    nameEvidenceState: "caption-observed-creator-confirmation-open",
  },
  {
    id: "jay-tinsel",
    displayName: "Jay Tinsel",
    aliases: ["Jay Tinsel"],
    honor: "THE HOLIDAY HOLDOVER",
    tagline: "A name that keeps surviving beyond the Christmas stream.",
    nameEvidenceState: "caption-observed-creator-confirmation-open",
  },
  {
    id: "eduardo-santiago",
    displayName: "Eduardo Santiago",
    aliases: ["Eduardo Santiago"],
    honor: "THE SOURCE-LINKED REGULAR",
    tagline: "A repeat public name with tape receipts attached.",
    nameEvidenceState: "caption-observed-creator-confirmation-open",
  },
  {
    id: "matt-roberts",
    displayName: "Matt Roberts",
    aliases: ["Matt Roberts"],
    honor: "THE RETURNING READOUT",
    tagline: "Another familiar name in the livestream room.",
    nameEvidenceState: "caption-observed-creator-confirmation-open",
  },
  {
    id: "jack-ryan-boyd",
    displayName: "Jack Ryan Boyd",
    aliases: ["Jack Ryan Boyd"],
    honor: "THE THREE-NAME THREAT",
    tagline: "Hard for the room—and the tape—to forget.",
    nameEvidenceState: "caption-observed-creator-confirmation-open",
  },
  {
    id: "andrew-romano",
    displayName: "Andrew Romano",
    aliases: ["Andrew Romano"],
    honor: "THE ARCHIVE REGULAR",
    tagline: "A repeat presence in exact-name caption reads.",
    nameEvidenceState: "caption-observed-creator-confirmation-open",
  },
  {
    id: "tur-turlington",
    displayName: "Tur Turlington",
    aliases: ["Tur Turlington"],
    honor: "THE NAME THE TAPE REMEMBERS",
    tagline: "A channel-native handle with repeat show receipts.",
    nameEvidenceState: "caption-observed-public-handle",
  },
  {
    id: "frankenstein-studio",
    displayName: "Frankenstein Studio",
    aliases: ["Frankenstein Studio"],
    honor: "THE LAB REGULAR",
    tagline: "A horror-room handle that keeps reappearing.",
    nameEvidenceState: "caption-observed-public-handle",
  },
  {
    id: "wild-willie",
    displayName: "Wild Willie",
    aliases: ["Wild Willie"],
    honor: "THE WILD CARD",
    tagline: "The handle already came with its own Hall plaque.",
    nameEvidenceState: "caption-observed-public-handle",
    publicHandle: "@wildwillie3631",
    auditObservedShows: 54,
  },
  {
    id: "gary-mcdonald",
    displayName: "Gary McDonald",
    aliases: ["Gary McDonald"],
    honor: "THE MISSED-CHAT RECOVERY",
    tagline: "A repeat name in the room—and one the room has doubled back to recover.",
    nameEvidenceState: "caption-observed-creator-confirmation-open",
  },
  {
    id: "logan-evans",
    displayName: "Logan Evans",
    aliases: ["Logan Evans"],
    honor: "THE FIRST-SUPERCHAT CLUB",
    tagline: "A public name attached to a saved room interaction.",
    nameEvidenceState: "caption-observed-creator-confirmation-open",
  },
  {
    id: "dan-cat-nine",
    displayName: "Dan Cat9",
    aliases: ["Dan Cat9", "Dan Cat 9", "Dan Cat Nine"],
    honor: "THE HANDLE IN THE HAT",
    tagline: "A channel-native handle with an exact place in the tape.",
    nameEvidenceState: "caption-observed-public-handle",
  },
  {
    id: "jt-customs",
    displayName: "JT Customs",
    aliases: ["JT Customs", "JT Custom"],
    honor: "THE CUSTOM-BUILT REGULAR",
    tagline: "A repeat handle in the live-room ledger.",
    nameEvidenceState: "caption-variant-grouping-creator-confirmation-open",
    publicHandle: "@jtcustoms4297",
    auditObservedShows: 123,
  },
  {
    id: "blu-ray-addict",
    displayName: "Blu-ray Addict",
    aliases: ["Blu-ray Addict", "Bluray Addict"],
    honor: "THE PHYSICAL-MEDIA DIEHARD",
    tagline: "Exactly the kind of handle a movie channel should remember.",
    nameEvidenceState: "caption-observed-public-handle",
  },
  {
    id: "pop-culture-with-pat",
    displayName: "Pop Culture With Pat",
    aliases: ["Pop Culture With Pat"],
    honor: "THE POP-CULTURE PIPELINE",
    tagline: "A public handle that regularly enters the room conversation.",
    nameEvidenceState: "caption-observed-public-handle",
  },
  {
    id: "tomo",
    displayName: "Tomo",
    publicHandle: "@TomoEriGoto",
    aliases: ["Tomo"],
    honor: "THE OPENING-BELL REGULAR",
    tagline: "One of the handles already in the room when the tape starts rolling.",
    nameEvidenceState: "live-chat-handle-resolved-first-name-caution",
    auditObservedShows: 105,
  },
  {
    id: "dj-graham",
    displayName: "DJ Graham",
    publicHandle: "@DJGraham1995",
    aliases: ["DJ Graham"],
    honor: "THE GENEROUS NIGHT OWL",
    tagline: "A repeat supporter name the hosts have explicitly recognized on tape.",
    nameEvidenceState: "live-chat-handle-resolved",
    auditObservedShows: 96,
  },
  {
    id: "tiffany",
    displayName: "Tiffany",
    publicHandle: "@Tiffanys_Lifes_A_Horror_Movie2",
    aliases: ["Tiffany"],
    honor: "THE HORROR-MOVIE LIFER",
    tagline: "A replay-verified handle; first-name caption merges remain visibly provisional.",
    nameEvidenceState: "live-chat-handle-resolved-caption-merge-risk",
    auditObservedShows: 85,
  },
  {
    id: "gary-b",
    displayName: "Gary B",
    publicHandle: "@GaryB1987",
    aliases: ["Gary B"],
    honor: "THE LETTER-B REGULAR",
    tagline: "Kept separate from every other Gary in the room.",
    nameEvidenceState: "live-chat-handle-resolved",
    auditObservedShows: 58,
  },
  {
    id: "jeremy-shelley",
    displayName: "Jeremy Shelley",
    publicHandle: "@JeremyShelley-m3r",
    aliases: ["Jeremy Shelley", "Jeremy Shelly"],
    honor: "THE MEMBER MILESTONE MACHINE",
    tagline: "A repeat public handle with long-haul member callouts in the tape.",
    nameEvidenceState: "live-chat-handle-resolved",
    auditObservedShows: 48,
  },
  {
    id: "man-of-tomorrow",
    displayName: "Man of Tomorrow",
    publicHandle: "@ManOfTomorrow-J",
    aliases: ["Man of Tomorrow"],
    honor: "THE FUTURE OF THE CHAT",
    tagline: "A channel-native handle that keeps becoming part of the show.",
    nameEvidenceState: "live-chat-handle-resolved",
    auditObservedShows: 47,
  },
  {
    id: "mind-the-gap",
    displayName: "Mind the Gap",
    publicHandle: "@mindthegapmindthegap",
    aliases: ["Mind the Gap"],
    honor: "THE CONVERSATION SWITCH",
    tagline: "A repeat handle that opens another door in the room.",
    nameEvidenceState: "live-chat-handle-resolved",
    auditObservedShows: 41,
  },
  {
    id: "eric-the-hess",
    displayName: "Eric the Hess",
    publicHandle: "@EricTheHess",
    aliases: ["Eric the Hess"],
    honor: "THE STREAM-ELEMENTS STAPLE",
    tagline: "A repeat name in the mechanical voice and the human response.",
    nameEvidenceState: "live-chat-handle-resolved",
    auditObservedShows: 37,
  },
  {
    id: "papa-hades",
    displayName: "Papa Hades",
    publicHandle: "@papahades2982",
    aliases: ["Papa Hades"],
    honor: "THE UNDERWORLD REGULAR",
    tagline: "A horror-room handle built to survive the late shift.",
    nameEvidenceState: "live-chat-handle-resolved",
    auditObservedShows: 34,
  },
  {
    id: "dr-corn-dog",
    displayName: "Dr. Corn Dog",
    publicHandle: "@DrCorndogs",
    aliases: ["Dr Corn Dog", "Doctor Corn Dog", "Dr Corn Dogs"],
    honor: "THE CHARACTER-PROMPT PHYSICIAN",
    tagline: "Sometimes the prescription is another filthy Loomis or Challis prompt.",
    nameEvidenceState: "live-chat-handle-resolved",
    auditObservedShows: 29,
  },
];

const interactionGrammar =
  /\b(?:says?|said|asks?|asked|writes?|wrote|sent|sends|super\s*chat|superchat|donat(?:e|ed|ion)|gift(?:ed|ing)?|member|became\s+a\s+member|thank(?:s| you)?|appreciate|we\s+have|we\s+got|from|love\s+you|happy\s+birthday|shout\s*out|comes?\s+through|gives?\s+so\s+much)\b/i;
const supportGrammar =
  /\b(?:super\s*chat|superchat|donat(?:e|ed|ion)|gift(?:ed|ing)?|became\s+a\s+member|membership|gives?\s+so\s+much|too\s+kind|comes?\s+through|support(?:er|ing)?)\b/i;
const birthdayGrammar = /\b(?:happy\s+birthday|birthday)\b/i;
const characterGrammar =
  /\b(?:loomis|lumis|challis|slenderman|feldman|character|voice|impression)\b/i;

function clean(value) {
  return String(value == null ? "" : value)
    .replace(/>>/g, " ")
    .replace(/\[\s*__\s*\]/g, "[BLEEP]")
    .replace(/\[(?:music|laughter|applause|cheering)\]/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalized(value) {
  return clean(value)
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\[bleep\]/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function regexForAlias(alias) {
  const words = normalized(alias).split(" ").filter(Boolean);
  if (!words.length) return null;
  /*
   * YouTube ASR commonly inserts a censored word between nickname tokens.
   * Allow one short filler token between words while preserving the entire
   * stable public name sequence.
   */
  const bridge = "(?:\\s+(?:the|fucking|bleep|uh|um))?\\s+";
  return new RegExp(`\\b${words.map(escapeRegex).join(bridge)}\\b`, "i");
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function boundedExcerpt(text, displayName, maxWords = 20) {
  const cleaned = clean(text);
  if (!cleaned) return "";
  const tokens = cleaned.split(/\s+/).filter(Boolean);
  const nameTokens = normalized(displayName).split(" ").filter(Boolean);
  let nameIndex = -1;
  for (let index = 0; index < tokens.length; index += 1) {
    const slice = normalized(tokens.slice(index, index + nameTokens.length + 3).join(" "));
    if (nameTokens.every((token) => slice.includes(token))) {
      nameIndex = index;
      break;
    }
  }
  const start = Math.max(0, nameIndex < 0 ? 0 : nameIndex - 4);
  const excerpt = tokens.slice(start, start + maxWords).join(" ");
  return excerpt.length < cleaned.length ? `${excerpt}…` : excerpt;
}

function classify(context) {
  if (birthdayGrammar.test(context)) return "BIRTHDAY / ROOM RITUAL";
  if (supportGrammar.test(context)) return "EXPLICIT SUPPORT CALLOUT";
  if (characterGrammar.test(context)) return "CHARACTER / BIT TRIGGER";
  return "CHAT READOUT";
}

function interactionWeight(kind) {
  return {
    "EXPLICIT SUPPORT CALLOUT": 4,
    "BIRTHDAY / ROOM RITUAL": 3,
    "CHARACTER / BIT TRIGGER": 2,
    "CHAT READOUT": 1,
  }[kind] || 0;
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function metadataFor(sourceId) {
  const file = path.join(metadataDir, `${sourceId}.json`);
  return fs.existsSync(file) ? readJson(file) : null;
}

function dateFromMetadata(metadata) {
  const raw = String(metadata?.upload_date || "");
  return /^\d{8}$/.test(raw)
    ? `${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)}`
    : "";
}

function sourceEvents(payload) {
  return (Array.isArray(payload?.events) ? payload.events : [])
    .filter((event) => Array.isArray(event?.segs) && Number.isFinite(event?.tStartMs))
    .map((event) => ({
      at: Math.max(0, Number(event.tStartMs) / 1000),
      duration: Math.max(0, Number(event.dDurationMs || 0) / 1000),
      text: clean(event.segs.map((segment) => segment?.utf8 || "").join("")),
    }))
    .filter((event) => event.text);
}

const compiledRoster = roster.map((member) => ({
  member,
  aliases: member.aliases.map((alias) => ({
    alias,
    pattern: regexForAlias(alias),
  })),
}));
const combinedAliasPattern = new RegExp(
  compiledRoster
    .flatMap((entry) => entry.aliases.map((alias) => `(?:${alias.pattern.source})`))
    .join("|"),
  "gi",
);

function eventIndexAt(starts, offset) {
  let low = 0;
  let high = starts.length - 1;
  while (low <= high) {
    const middle = (low + high) >> 1;
    if (starts[middle] <= offset) low = middle + 1;
    else high = middle - 1;
  }
  return Math.max(0, high);
}

function isBoundedInteractionRead(context, matchedText) {
  const text = normalized(context);
  const name = normalized(matchedText);
  const nameAt = text.indexOf(name);
  if (nameAt < 0) return false;
  const before = text.slice(Math.max(0, nameAt - 72), nameAt);
  const after = text.slice(nameAt + name.length, nameAt + name.length + 104);
  const afterRead =
    /^(?:\s+[a-z0-9]+){0,3}\s+(?:says?|said|asks?|asked|writes?|wrote|sent|sends|with\s+(?:a\s+)?super\s*chat|became\s+a\s+member|gifted|donated)\b/i
      .test(after);
  const beforeRead =
    /\b(?:we\s+have|we\s+got|from|thanks?|thank\s+you|appreciate|love\s+you|hey|shout\s*out)(?:\s+[a-z0-9]+){0,4}\s*$/i
      .test(before);
  const explicitSupport = supportGrammar.test(
    `${before.slice(-48)} ${name} ${after.slice(0, 72)}`,
  );
  const ritual = birthdayGrammar.test(after.slice(0, 72)) &&
    /\b(?:happy|birthday|thank|love)\b/i.test(after.slice(0, 72));
  return afterRead || beforeRead || explicitSupport || ritual;
}

function calloutsForSource(sourceId, payload, metadata) {
  const events = sourceEvents(payload);
  const duration = Math.max(0, Number(metadata?.duration || 0));
  const found = [];
  const normalizedEvents = events.map((event) => normalized(event.text));
  const starts = [];
  let joined = "";
  normalizedEvents.forEach((text) => {
    starts.push(joined.length);
    joined += `${text}\n`;
  });
  combinedAliasPattern.lastIndex = 0;
  let match;
  while ((match = combinedAliasPattern.exec(joined))) {
    const index = eventIndexAt(starts, match.index);
    const start = Math.max(0, index - 3);
    const stop = Math.min(events.length, index + 6);
    const contextEvents = events.slice(start, stop);
    const context = clean(contextEvents.map((event) => event.text).join(" "));
    const directContext = clean(events
      .slice(Math.max(0, index - 1), Math.min(events.length, index + 3))
      .map((event) => event.text)
      .join(" "));
    if (!interactionGrammar.test(directContext)) continue;
    const normalizedMatch = normalized(match[0]);
    const rosterMatch = compiledRoster.find((entry) =>
      entry.aliases.some((alias) => alias.pattern.test(normalizedMatch)));
    if (!rosterMatch) continue;
    const { member } = rosterMatch;
    const leeSupportRead = member.id === "lee-the-machine-bowers";
    if (!isBoundedInteractionRead(directContext, normalizedMatch) &&
        !leeSupportRead) continue;
    const aliasMatch = rosterMatch.aliases.find((alias) =>
      alias.pattern.test(normalizedMatch));
    const anchor = events[index];
    const at = Math.max(0, Math.floor(anchor.at));
    const kind = classify(context);
    const end = Math.min(
      duration || Math.ceil(at + 28),
      Math.max(at + 8, Math.ceil(at + (kind === "CHAT READOUT" ? 22 : 34))),
    );
    found.push({
      id: `${sourceId}:fam:${member.id}:${at}`,
      fanId: member.id,
      displayName: member.displayName,
      at,
      end: end > at ? end : at + 8,
      interactionType: kind,
      excerpt: boundedExcerpt(context, aliasMatch?.alias || match[0]),
      evidenceState: "automatic-caption-name-readout",
      spellingState: member.nameEvidenceState,
      matchedCaptionForm: clean(aliasMatch?.alias || match[0]),
    });
  }

  const deduped = [];
  found
    .sort((left, right) =>
      left.at - right.at ||
      interactionWeight(right.interactionType) - interactionWeight(left.interactionType))
    .forEach((candidate) => {
      const duplicate = deduped.findIndex((kept) =>
        kept.fanId === candidate.fanId &&
        Math.abs(kept.at - candidate.at) <= 28);
      if (duplicate < 0) {
        deduped.push(candidate);
        return;
      }
      if (interactionWeight(candidate.interactionType) >
          interactionWeight(deduped[duplicate].interactionType)) {
        deduped[duplicate] = candidate;
      }
    });

  return deduped.sort((left, right) => left.at - right.at);
}

const captionFiles = fs.readdirSync(captionsDir)
  .filter((file) => file.endsWith(".json"))
  .sort();
const shows = {};
const memberStats = new Map(roster.map((member) => [
  member.id,
  {
    ...member,
    observedShows: new Set(),
    observedReadouts: 0,
    interactionCounts: {},
    featuredReceipts: [],
  },
]));

for (const file of captionFiles) {
  const sourceId = path.basename(file, ".json");
  const metadata = metadataFor(sourceId);
  if (!metadata || String(metadata.channel_id || "") !== "UC6ieEOZW4iXV8TcILJI8k5g") {
    continue;
  }
  const callouts = calloutsForSource(
    sourceId,
    readJson(path.join(captionsDir, file)),
    metadata,
  );
  if (!callouts.length) continue;
  const date = dateFromMetadata(metadata);
  shows[sourceId] = {
    sourceId,
    title: clean(metadata.title),
    date,
    duration: Number(metadata.duration || 0),
    thumbnail: clean(metadata.thumbnail) ||
      `https://i.ytimg.com/vi/${sourceId}/maxresdefault.jpg`,
    callouts,
  };
  for (const callout of callouts) {
    const stats = memberStats.get(callout.fanId);
    stats.observedShows.add(sourceId);
    stats.observedReadouts += 1;
    stats.interactionCounts[callout.interactionType] =
      (stats.interactionCounts[callout.interactionType] || 0) + 1;
    stats.featuredReceipts.push({
      sourceId,
      at: callout.at,
      end: callout.end,
      date,
      title: clean(metadata.title),
      interactionType: callout.interactionType,
      excerpt: callout.excerpt,
    });
  }
}

function tierFor(observedShows) {
  if (observedShows >= 50) return "FIRST BALLOT";
  if (observedShows >= 20) return "ROOM REGULARS";
  return "THE DEEP BENCH";
}

function chooseFeatured(receipts) {
  const ranked = receipts.slice().sort((left, right) =>
    interactionWeight(right.interactionType) - interactionWeight(left.interactionType) ||
    String(right.date).localeCompare(String(left.date)) ||
    left.at - right.at);
  const output = [];
  const usedSources = new Set();
  for (const receipt of ranked) {
    if (usedSources.has(receipt.sourceId)) continue;
    usedSources.add(receipt.sourceId);
    output.push(receipt);
    if (output.length >= 4) break;
  }
  return output;
}

const hallOfFame = Array.from(memberStats.values())
  .map((stats) => {
    const publishedShowReceipts = stats.observedShows.size;
    const observedShows = Number(stats.auditObservedShows || publishedShowReceipts);
    return {
      id: stats.id,
      displayName: stats.displayName,
      publicHandle: stats.publicHandle || "",
      youtubeChannelId: stats.youtubeChannelId || "",
      aliases: stats.aliases,
      honor: stats.honor,
      tagline: stats.tagline,
      tier: tierFor(observedShows),
      observedShows,
      publishedShowReceipts,
      observedReadouts: stats.observedReadouts,
      interactionCounts: stats.interactionCounts,
      nameEvidenceState: stats.nameEvidenceState,
      verifiedReplaySample: stats.verifiedReplaySample || null,
      featuredReceipts: chooseFeatured(stats.featuredReceipts),
    };
  })
  .filter((member) => member.observedShows >= 3)
  .sort((left, right) =>
    right.observedShows - left.observedShows ||
    right.observedReadouts - left.observedReadouts ||
    left.displayName.localeCompare(right.displayName));

const latestShows = Object.values(shows)
  .sort((left, right) =>
    String(right.date).localeCompare(String(left.date)) ||
    left.sourceId.localeCompare(right.sourceId))
  .slice(0, 8)
  .map((show) => ({
    sourceId: show.sourceId,
    title: show.title,
    date: show.date,
    thumbnail: show.thumbnail,
    calloutCount: show.callouts.length,
    fanCount: new Set(show.callouts.map((callout) => callout.fanId)).size,
    callouts: show.callouts,
  }));

const generated = {
  schema: "shokker-lore/wwam-fam-index/v1",
  generatorVersion: "1.0.0",
  sourceSnapshot: "local-youtube-json3-auto-caption-cache",
  evidencePolicy: {
    rankingUnit: "distinct shows containing a conservative exact-name interaction readout",
    publicClaim:
      "Observed-show and readout counts describe this caption index only. They are not donation totals, authenticated identities, or creator-certified rankings.",
    speakerBoundary:
      "Automatic captions are not speaker-diarized. Cards identify the public name being read, not who spoke it.",
    spellingBoundary:
      "Similar ASR spellings remain separate unless creator confirmation or stronger source evidence joins them.",
    supportBoundary:
      "A support badge appears only when the bounded caption context explicitly contains Superchat, membership, gifting, donation, or equivalent support language. No dollar amount is inferred.",
    liveChatSampleBoundary:
      "Dollar figures appear only for a named five-show YouTube live-chat replay sample with stable public channel IDs. They are sample totals, never lifetime totals.",
  },
  stats: {
    captionSourcesAudited: captionFiles.length,
    showsWithPublishedFamCallouts: Object.keys(shows).length,
    publishedCallouts: Object.values(shows)
      .reduce((total, show) => total + show.callouts.length, 0),
    hallMembers: hallOfFame.length,
  },
  spellingDesk: {
    michaelParten:
      'YouTube live-chat replay resolves the public handle as @MichaelParten1 (Parten). Automatic captions misrender host readouts as Parton and Barton; those audio spellings are search aliases, not separate Hall members.',
    correctionPolicy:
      "Creator confirmation can update a public display name without changing the original source IDs and timestamps.",
  },
  hallOfFame,
  latestShows,
  shows,
};

const banner = [
  "/*",
  " * GENERATED FILE — DO NOT HAND EDIT.",
  " * Run: node scripts/generate-wwam-fam-index.mjs",
  " * Public output contains bounded source receipts only; raw caption files stay private.",
  " */",
].join("\n");
const javascript = `${banner}\n(function (root) {\n  \"use strict\";\n  root.WWAM_FAM_INDEX = Object.freeze(${JSON.stringify(generated)});\n})(typeof window !== \"undefined\" ? window : globalThis);\n`;
fs.writeFileSync(outputPath, javascript, "utf8");

console.log(JSON.stringify({
  output: path.relative(root, outputPath),
  ...generated.stats,
  leaders: hallOfFame.slice(0, 8).map((member) => ({
    name: member.displayName,
    observedShows: member.observedShows,
    observedReadouts: member.observedReadouts,
  })),
}, null, 2));
