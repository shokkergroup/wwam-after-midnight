import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const demo = path.join(here, "..", "public", "demo");

function load() {
  const sandbox = { window: {} };
  vm.createContext(sandbox);
  for (const file of ["episode-recap-engine.js", "wwam-episode-recap-adapter.js"]) {
    vm.runInContext(fs.readFileSync(path.join(demo, file), "utf8"), sandbox, {
      filename: file,
    });
  }
  return sandbox.window;
}

function source(overrides = {}) {
  return {
    id: "abcdefghijk",
    title: "Horror News Live",
    displayTitle: "Horror News Live",
    date: "2026-07-23",
    duration: 7_800,
    views: 12_345,
    url: "https://www.youtube.com/watch?v=abcdefghijk",
    coverage: "caption-backed",
    wordsAudited: 40_000,
    ...overrides,
  };
}

function receipt(key, at, kind, label, signalScore = 50) {
  return {
    key,
    sourceId: "abcdefghijk",
    at,
    end: at + 24,
    kind,
    label,
    excerpt: kind === "moment" ? "bounded source excerpt" : "",
    publicExcerptAllowed: kind === "moment",
    signalScore,
    evidenceBasis: "synthetic-source-local-test",
  };
}

test("universal map and WWAM voice pack produce deterministic chronological recaps", () => {
  const window = load();
  const receipts = [
    receipt("topic:halloween", 90, "topic", "Halloween", 80),
    receipt("moment:open", 720, "moment", "THE ROOM BREAKS", 75),
    receipt("topic:scream", 1_900, "topic", "Scream", 70),
    receipt("moment:middle", 3_650, "moment", "UP IN YA", 99),
    receipt("topic:elm", 5_100, "topic", "A Nightmare on Elm Street", 60),
    receipt("moment:late", 7_200, "moment", "FULL SEND", 86),
  ];
  const input = {
    source: source(),
    receipts,
    format: { id: "horror-news", label: "HORROR NEWS SHOW", basis: "source-title-metadata" },
    context: {
      registeredOverview:
        "The original show read follows Halloween, Scream, and the Elm Street turn without losing the plot.",
    },
  };
  const firstMap = window.ShokkerEpisodeRecap.build(input);
  const secondMap = window.ShokkerEpisodeRecap.build(input);
  const first = window.WWAMEpisodeRecapAdapter.build({ map: firstMap });
  const second = window.WWAMEpisodeRecapAdapter.build({ map: secondMap });

  assert.equal(firstMap.schema, "shokker-episode-recap/v1");
  assert.equal(firstMap.evidenceState, "ready");
  assert.equal(firstMap.mode, "receipt-recap");
  assert.deepEqual(JSON.parse(JSON.stringify(firstMap)), JSON.parse(JSON.stringify(secondMap)));
  assert.deepEqual(JSON.parse(JSON.stringify(first)), JSON.parse(JSON.stringify(second)));
  assert.equal(first.schema, "wwam-feldman-recap/v1");
  assert.equal(first.label, "WWAM FELDMAN APPROVED RECAP");
  assert.equal(first.approval.actualApproval, false);
  assert.ok(first.sections.length >= 4);
  assert.ok(first.sections.every((section) => section.receiptKeys.length));
  assert.deepEqual(
    first.sections.map((section) => section.at),
    first.sections.map((section) => section.at).slice().sort((a, b) => a - b),
  );
  assert.equal(first.caseFile.receiptCount, receipts.length);
  assert.equal(first.caseFile.topicCount, 3);
  assert.equal(first.caseFile.momentCount, 3);
  assert.equal(first.caseFile.storyReceiptCount, receipts.length);
  assert.equal(first.caseFile.storyCoveragePercent, 100);
  assert.ok(first.story.length >= 2);
  assert.deepEqual(
    Array.from(new Set(first.story.flatMap((segment) => segment.receiptKeys))).sort(),
    receipts.map((item) => item.key).sort(),
  );
  const receiptByKey = new Map(receipts.map((item) => [item.key, item]));
  assert.ok(first.story.some((segment) => segment.anchorAt !== segment.at));
  assert.ok(first.story.every((segment) => {
    const anchor = receiptByKey.get(segment.anchorReceiptKey);
    return anchor &&
      segment.receiptKeys.includes(segment.anchorReceiptKey) &&
      segment.anchorAt === anchor.at &&
      (!segment.excerpt || segment.excerpt === anchor.excerpt);
  }));
  assert.ok(first.story.every((segment) =>
    /source|tape|ledger|security footage|evidence/i.test(segment.body)
  ));
  assert.match(first.overview, /opens at 1:30 with Halloween/i);
  assert.ok(first.overview.startsWith(input.context.registeredOverview));
  assert.equal(firstMap.registeredOverview, input.context.registeredOverview);
  assert.match(first.overview, /turns toward Scream around 31:40/i);
  assert.match(first.overview, /top replay pick lands at 1:00:50 under Up In Ya/i);
  assert.match(first.overview, /All 6 chapters are clickable/i);
  assert.ok(first.sections.some((section) => /bounded source excerpt/i.test(section.body)));
  assert.match(first.limitations.join(" "), /transcript timing does not establish the speaker/i);
});

test("commentary headlines identify the actual film instead of reusing a franchise template", () => {
  const window = load();
  const makeRecap = (id, title) => {
    const receipts = [
      {
        ...receipt("topic:myers", 90, "topic", "Michael Myers", 80),
        sourceId: id,
      },
      {
        ...receipt("topic:halloween", 840, "topic", "Halloween", 75),
        sourceId: id,
      },
      {
        ...receipt("moment:mask", 2_100, "moment", "THE MASK AND THE LOOK", 92),
        sourceId: id,
      },
    ];
    const map = window.ShokkerEpisodeRecap.build({
      source: source({
        id,
        title,
        displayTitle: title,
      }),
      receipts,
      format: {
        id: "movie-commentary",
        label: "MOVIE COMMENTARY",
        basis: "registered-source-type",
      },
    });
    return window.WWAMEpisodeRecapAdapter.build({ map });
  };

  const h20 = makeRecap("filmwiki01A", "Halloween H20");
  const resurrection = makeRecap("filmwiki01B", "Halloween: Resurrection");

  assert.match(h20.headline, /HALLOWEEN H20/);
  assert.match(resurrection.headline, /HALLOWEEN: RESURRECTION/);
  assert.notEqual(h20.headline, resurrection.headline);
});

test("channel title topics outrank incidental signal without changing receipt evidence", () => {
  const window = load();
  const receipts = [
    receipt("topic:marvel", 90, "topic", "TOPIC: MARVEL", 100),
    receipt("topic:elm", 800, "topic", "TOPIC: A NIGHTMARE ON ELM STREET", 20),
    receipt("topic:halloween", 1_500, "topic", "TOPIC: HALLOWEEN", 80),
  ];
  const map = window.ShokkerEpisodeRecap.build({
    source: source({
      title: "FREDDY KRUEGER Death Scenes Tier List Ranking!",
      displayTitle: "FREDDY KRUEGER Death Scenes Tier List Ranking!",
      duration: 2_000,
    }),
    receipts,
    context: {
      titleTopics: ["A Nightmare on Elm Street", "Marvel", "Halloween"],
      lanes: [],
    },
    format: { id: "ranking-show", label: "RANKING / BRACKET SHOW", basis: "title" },
  });
  const recap = window.WWAMEpisodeRecapAdapter.build({ map });

  assert.equal(map.topics[0], "A Nightmare on Elm Street");
  assert.match(recap.headline, /A NIGHTMARE ON ELM STREET/);
  assert.doesNotMatch(recap.headline, /TOPIC:/);
  assert.equal(recap.caseFile.topicCount, 3);
});

test("reviewed guide structure deepens the full chronicle without leaking review-machine prose", () => {
  const window = load();
  const receipts = [
    receipt("topic:halloween", 60, "topic", "Halloween", 80),
    {
      ...receipt("moment:opening", 70, "moment", "Opening reaction", 75),
      excerpt: "The opening reaction changes the temperature.",
    },
    receipt("topic:casting", 600, "topic", "Casting", 70),
    receipt("topic:horror", 1200, "topic", "Horror", 60),
    {
      ...receipt("moment:middle", 1210, "moment", "THE ROOM BREAKS", 99),
      excerpt: "The middle turn sends the conversation sideways.",
    },
    receipt("topic:scream", 3000, "topic", "Scream", 90),
  ];
  const episodeGuide = {
    schema: "wwam-episode-guide/v2",
    overview: "A machine draft files bounded source-local evidence at a review desk.",
    evidenceSummary: "Six registered receipts cross the evidence boundary.",
    recap: {
      status: "machine-draft-review-required",
      headline: "A machine headline",
      dek: "A bounded route through registered receipts.",
      paragraphs: [
        {
          at: 60,
          end: 84,
          cutId: "cut-opening",
          topic: "Halloween",
          excerpt: "Halloween gets the night moving.",
          body: "The review desk files a bounded opening receipt.",
        },
        {
          at: 600,
          end: 624,
          cutId: "cut-casting",
          topic: "Casting",
          excerpt: "Casting becomes the next subject.",
          body: "The machine route registers a casting file.",
        },
        {
          at: 1200,
          end: 1224,
          cutId: "cut-horror",
          topic: "Horror",
          excerpt: "Horror changes the temperature.",
          body: "The evidence boundary opens another desk file.",
        },
        {
          at: 3000,
          end: 3024,
          cutId: "cut-scream",
          topic: "Scream",
          excerpt: "Scream gets the closing turn.",
          body: "The final indexed receipt closes the machine route.",
        },
      ],
    },
    chapters: [
      {
        id: "chapter-opening",
        at: 60,
        end: 84,
        topic: "Halloween",
        label: "Halloween // OPENING READ",
        category: "OPENING READ",
        excerpt: "Halloween gets the night moving.",
        body: "The review desk files a bounded opening receipt.",
        cutId: "cut-opening",
      },
      {
        id: "chapter-horror",
        at: 1200,
        end: 1224,
        topic: "Horror",
        label: "Horror // MIDPOINT TURN",
        category: "THE ROOM BREAKS",
        excerpt: "Horror changes the temperature.",
        body: "The evidence boundary opens another desk file.",
        cutId: "cut-horror",
      },
      {
        id: "chapter-scream",
        at: 3000,
        end: 3024,
        topic: "Scream",
        label: "Scream // CLOSING READ",
        category: "CLOSING READ",
        excerpt: "Scream gets the closing turn.",
        body: "The final indexed receipt closes the machine route.",
        cutId: "cut-scream",
      },
    ],
    takeArc: [
      {
        phase: "OPENING READ",
        label: "Halloween // OPENING READ",
        at: 60,
        end: 84,
        cutId: "cut-opening",
        excerpt: "Halloween gets the night moving.",
      },
      {
        phase: "MIDPOINT TURN",
        label: "Horror // THE ROOM BREAKS",
        at: 1200,
        end: 1224,
        cutId: "cut-horror",
        excerpt: "Horror changes the temperature.",
      },
      {
        phase: "CLOSING READ",
        label: "Scream // CLOSING READ",
        at: 3000,
        end: 3024,
        cutId: "cut-scream",
        excerpt: "Scream gets the closing turn.",
      },
    ],
    threads: [
      { name: "Halloween", mentions: 9, score: 90 },
      { name: "Horror", mentions: 7, score: 70 },
      { name: "Scream", mentions: 6, score: 60 },
    ],
  };
  const map = window.ShokkerEpisodeRecap.build({
    source: source({
      title: "Halloween Horror and Scream Live",
      displayTitle: "Halloween Horror and Scream Live",
      duration: 3_300,
    }),
    receipts,
    episodeGuide,
    context: {
      titleTopics: ["Halloween", "Horror", "Scream"],
      lanes: [],
    },
    format: { id: "horror-news", label: "HORROR NEWS SHOW", basis: "title" },
  });
  const recap = window.WWAMEpisodeRecapAdapter.build({ map });
  const entertainmentCopy = [
    recap.headline,
    recap.deck,
    recap.overview,
    ...recap.sections.flatMap((section) => [section.label, section.body]),
    ...recap.story.flatMap((segment) => [segment.label, segment.body]),
  ].join(" ");

  assert.equal(recap.generatorVersion, window.WWAMEpisodeRecapAdapter.VERSION);
  assert.match(
    recap.overview,
    /deeper recap starts with Halloween at 1:00, checks in on Casting at 10:00 and Horror at 20:00, and closes with Scream at 50:00/i,
  );
  assert.match(
    recap.overview,
    /three-beat watch path runs from Halloween at 1:00, through Horror at 20:00, to Scream at 50:00/i,
  );
  assert.match(recap.sections[0].body, /episode arc opens at 1:00 with Halloween/i);
  assert.match(recap.sections.at(-1).body, /closing read lands at 50:00 on Scream/i);
  assert.doesNotMatch(
    entertainmentCopy,
    /\b(?:desk|file|receipt|registered|bounded|source-local|machine surfaced|evidence boundary|route|indexed)\b/i,
  );
});

test("the overview favors a title-relevant replay over a hotter but unrelated caption fragment", () => {
  const window = load();
  const receipts = [
    receipt("topic:halloween", 100, "topic", "Halloween", 80),
    {
      ...receipt("moment:unrelated", 400, "moment", "FULL SEND", 100),
      excerpt: "The calendar discussion takes a loud but unrelated turn.",
    },
    {
      ...receipt("moment:myers", 1200, "moment", "FILM READ", 70),
      excerpt: "Michael Myers changes the entire Halloween ending.",
    },
    receipt("topic:myers", 1210, "topic", "Michael Myers", 60),
  ];
  const map = window.ShokkerEpisodeRecap.build({
    source: source({
      title: "Halloween Kills Michael Myers Discussion",
      displayTitle: "Halloween Kills Michael Myers Discussion",
      duration: 1_800,
    }),
    receipts,
    context: {
      titleTopics: ["Halloween", "Michael Myers"],
      lanes: [],
    },
    format: { id: "horror-news", label: "HORROR NEWS SHOW", basis: "title" },
  });
  const recap = window.WWAMEpisodeRecapAdapter.build({ map });

  assert.equal(map.bestMoments[0].receiptKey, "moment:unrelated");
  assert.match(recap.overview, /top replay pick lands at 20:00 under Film Read/i);
  assert.match(recap.overview, /Michael Myers changes the entire Halloween ending/i);
  assert.doesNotMatch(recap.overview, /calendar discussion/i);
});

test("playable acts reserve distinct subject doors instead of becoming a heat-only playlist", () => {
  const window = load();
  const receipts = [
    receipt("topic:halloween", 120, "topic", "Halloween", 12),
    receipt("moment:one", 720, "moment", "UP IN YA", 100),
    receipt("topic:scream", 1_440, "topic", "Scream", 11),
    receipt("moment:two", 2_100, "moment", "THE ROOM BREAKS", 99),
    receipt("topic:elm", 2_850, "topic", "A Nightmare on Elm Street", 10),
    receipt("moment:three", 3_550, "moment", "FULL SEND", 98),
    receipt("topic:friday", 4_200, "topic", "Friday the 13th", 9),
    receipt("moment:four", 4_900, "moment", "TAKE GETS NUCLEAR", 97),
    receipt("topic:evil-dead", 5_650, "topic", "Evil Dead", 8),
    receipt("moment:five", 6_300, "moment", "OUT OF POCKET", 96),
    receipt("topic:alien", 6_950, "topic", "Alien", 7),
    receipt("moment:six", 7_500, "moment", "THE ROOM BREAKS AGAIN", 95),
  ];
  const map = window.ShokkerEpisodeRecap.build({
    source: source({
      title: "Halloween and Scream Horror News Live",
      displayTitle: "Halloween and Scream Horror News Live",
    }),
    receipts,
    format: { id: "horror-news", label: "HORROR NEWS SHOW", basis: "title" },
  });
  const topicActs = map.sections.filter((section) => section.category === "topic");

  assert.equal(map.sections.length, 8);
  assert.ok(topicActs.length >= 4);
  assert.ok(topicActs.some((section) => section.anchor === "Halloween"));
  assert.ok(topicActs.some((section) => section.anchor === "Scream"));
});

test("receipt recap acts never borrow a distant topic for a different timestamp", () => {
  const window = load();
  const receipts = [
    receipt("topic:casting", 100, "topic", "TOPIC: CASTING", 100),
    receipt("moment:detour", 1_000, "moment", "UP IN YA", 99),
    receipt("topic:halloween", 1_090, "topic", "TOPIC: HALLOWEEN", 60),
    receipt("moment:late", 2_400, "moment", "THE ROOM BREAKS", 80),
    receipt("topic:scream", 2_900, "topic", "TOPIC: SCREAM", 90),
  ];
  const map = window.ShokkerEpisodeRecap.build({
    source: source({ duration: 3_200 }),
    receipts,
    format: { id: "horror-news", label: "HORROR NEWS SHOW", basis: "title" },
  });
  const recap = window.WWAMEpisodeRecapAdapter.build({ map });
  const detourMap = map.sections.find((section) => section.at === 1_000);
  const detourRecap = recap.sections.find((section) => section.at === 1_000);
  const lateMap = map.sections.find((section) => section.at === 2_400);
  const lateRecap = recap.sections.find((section) => section.at === 2_400);

  assert.ok(detourMap);
  assert.ok(detourRecap);
  assert.deepEqual(
    Array.from(detourMap.receiptKeys),
    ["moment:detour", "topic:halloween"],
  );
  assert.equal(detourMap.subject, "HALLOWEEN");
  assert.doesNotMatch(detourRecap.body, /CASTING|SCREAM/i);
  assert.match(detourRecap.body, /Halloween/i);

  assert.ok(lateMap);
  assert.ok(lateRecap);
  assert.deepEqual(Array.from(lateMap.receiptKeys), ["moment:late"]);
  assert.equal(lateMap.subject, "THE ROOM BREAKS");
  assert.doesNotMatch(lateRecap.body, /SCREAM/i);
  assert.equal(
    lateMap.evidenceBasis,
    "source-local-receipts-temporally-bound-to-anchor",
  );
});

test("metadata-only sources get a visible held module with zero semantic claims", () => {
  const window = load();
  const map = window.ShokkerEpisodeRecap.build({
    source: source({
      coverage: "metadata-only",
      wordsAudited: 0,
    }),
    receipts: [],
    format: { id: "livestream", label: "WWAM LIVESTREAM", basis: "registered-source-type" },
  });
  const recap = window.WWAMEpisodeRecapAdapter.build({ map });

  assert.equal(map.evidenceState, "held");
  assert.equal(recap.state, "held");
  assert.equal(recap.label, "EPISODE RECAP");
  assert.equal(recap.badge, "RECAP WAITING ON THE TAPE");
  assert.equal(recap.sections.length, 0);
  assert.equal(recap.story.length, 0);
  assert.equal(recap.bestMoments.length, 0);
  assert.equal(recap.approval.actualApproval, false);
  assert.doesNotMatch(recap.label, /feldman approved/i);
  assert.match(recap.overview, /will not invent scenes, jokes, reactions, speakers, topics, or verdicts/i);
});

test("age-gated exact cuts disclose a playable official alternate without crossing timelines", () => {
  const window = load();
  const heldSource = source({
    title: "Rob Zombie's Halloween II Commentary",
    displayTitle: "Rob Zombie's Halloween II",
    coverage: "metadata-only",
    wordsAudited: 0,
    exactSourceHold: {
      state: "held-age-gated",
      reason: "The exact YouTube cut requires age-authenticated media access.",
    },
    officialAlternate: {
      kind: "official-podcast-edition",
      title: "Rob Zombies H2 Commentary",
      episodeUrl: "https://podcasters.spotify.com/pod/show/example/episodes/h2",
      enclosureUrl: "https://traffic.megaphone.fm/H2.mp3",
      duration: 7_352.61,
      canonicalDuration: 7_247,
      durationDelta: 105.61,
      timestampIsomorphic: false,
      publicPlaybackAllowed: true,
      evidenceBoundary:
        "Official WWAM podcast edition; not substituted for YouTube timestamps.",
    },
  });
  const map = window.ShokkerEpisodeRecap.build({
    source: heldSource,
    receipts: [],
    format: {
      id: "movie-commentary",
      label: "MOVIE COMMENTARY",
      basis: "registered-source-type",
    },
  });
  const recap = window.WWAMEpisodeRecapAdapter.build({
    map,
    source: heldSource,
  });
  const changedAlternateMap = window.ShokkerEpisodeRecap.build({
    source: {
      ...heldSource,
      officialAlternate: {
        ...heldSource.officialAlternate,
        durationDelta: 106.61,
      },
    },
    receipts: [],
    format: {
      id: "movie-commentary",
      label: "MOVIE COMMENTARY",
      basis: "registered-source-type",
    },
  });

  assert.equal(recap.state, "held");
  assert.notEqual(map.semanticFingerprint, changedAlternateMap.semanticFingerprint);
  assert.match(recap.headline, /AGE GATE/);
  assert.match(recap.overview, /official WWAM podcast edition/i);
  assert.match(recap.overview, /separated alternate edit/i);
  assert.doesNotMatch(recap.overview, /playable now|full show now/i);
  assert.deepEqual(Array.from(recap.sections), []);
  assert.deepEqual(Array.from(recap.bestMoments), []);
});
