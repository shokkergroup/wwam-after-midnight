(function (root) {
  "use strict";

  var filmContext = {
    "scary-movie": {
      id: "scary-movie",
      title: "Scary Movie",
      year: 2000,
      director: "Keenen Ivory Wayans",
      runtimeMinutes: 88,
      rating: "R",
      budget: 19000000,
      worldwideBoxOffice: 277200000,
      image: "https://media.the-numbers.com/images/movie-posters/Scary-Movie.jpg",
      contextUrl: "https://www.miramax.com/movie/scary-movie/",
      numbersUrl: "https://www.the-numbers.com/movie/Scary-Movie",
      contextLabel: "HORROR SPOOF BREAKOUT",
      fact: "The first film launched the franchise and earned more than fourteen times its reported production budget worldwide.",
      status: "third-party film context; separate from WWAM source evidence"
    },
    "scary-movie-2": {
      id: "scary-movie-2",
      title: "Scary Movie 2",
      year: 2001,
      director: "Keenen Ivory Wayans",
      runtimeMinutes: 82,
      rating: "R",
      budget: 45000000,
      worldwideBoxOffice: 141189101,
      image: "https://media.the-numbers.com/images/movie-posters/Scary-Movie-2.jpg",
      contextUrl: "https://www.miramax.com/movie/scary-movie-2/",
      numbersUrl: "https://www.the-numbers.com/movie/Scary-Movie-2",
      contextLabel: "HAUNTED-HOUSE SEQUEL",
      fact: "The sequel moved the spoof machine into an exorcism and haunted-house framework.",
      status: "third-party film context; separate from WWAM source evidence"
    },
    "harold-kumar": {
      id: "harold-kumar",
      title: "Harold & Kumar Go to White Castle",
      year: 2004,
      director: "Danny Leiner",
      runtimeMinutes: 88,
      rating: "R",
      budget: 9000000,
      worldwideBoxOffice: 19474552,
      estimatedDiscSales: 33430558,
      image: "https://media.the-numbers.com/images/movie-posters/Harold-and-Kumar-Go-to-White-Castle.jpg",
      contextUrl: "https://www.the-numbers.com/movie/Harold-and-Kumar-Go-to-White-Castle",
      numbersUrl: "https://www.the-numbers.com/movie/Harold-and-Kumar-Go-to-White-Castle",
      contextLabel: "STONER ROAD-TRIP CANON",
      fact: "Its estimated domestic disc sales later exceeded its theatrical worldwide gross.",
      status: "third-party film context; separate from WWAM source evidence"
    },
    "waiting": {
      id: "waiting",
      title: "Waiting...",
      year: 2005,
      director: "Rob McKittrick",
      runtimeMinutes: 94,
      rating: "R",
      budget: 1125000,
      worldwideBoxOffice: 18673274,
      estimatedDiscSales: 39848952,
      image: "https://media.the-numbers.com/images/movie-posters/Waiting.jpg",
      contextUrl: "https://www.the-numbers.com/movie/Waiting",
      numbersUrl: "https://www.the-numbers.com/movie/Waiting",
      contextLabel: "RESTAURANT-COMEDY PRESSURE COOKER",
      fact: "Its reported worldwide theatrical gross was about sixteen times its reported production budget.",
      status: "third-party film context; separate from WWAM source evidence"
    }
  };

  var entries = [
    {
      id: "patreon-160733511",
      sourceId: "160733511",
      filmId: "scary-movie",
      title: "SCARY MOVIE Commentary",
      date: "2026-06-10",
      provider: "Patreon",
      mediaKind: "podcast",
      officialUrl: "https://www.patreon.com/WeWatchedAMovie/posts/scary-movie-160733511",
      access: "member-source",
      wikiStatus: "sealed-source-brief",
      version: "2026 member commentary post",
      relationshipStatus: "official post verified; media not available to this public build",
      sourceSummary: "The official WWAM Patreon record identifies a Scary Movie commentary published June 10, 2026. The source audio was not supplied to this build, so no scene, quote, speaker, or timestamp is asserted.",
      sourceProof: ["official WWAM Patreon post id 160733511", "publication date verified", "post media type recorded as podcast"]
    },
    {
      id: "youtube-iMA-ZL5mi3I",
      sourceId: "iMA-ZL5mi3I",
      filmId: "scary-movie",
      title: "Scary Movie (2000) Commentary",
      date: "2026-06-10",
      provider: "YouTube",
      mediaKind: "members-only video",
      officialUrl: "https://www.youtube.com/watch?v=iMA-ZL5mi3I",
      access: "membership-unavailable",
      wikiStatus: "sealed-source-brief",
      version: "restored / audio-upgraded member upload",
      relationshipStatus: "possible same-day source family; equivalence to Patreon post is not certified",
      sourceSummary: "An official-channel member upload identifies a restored or audio-upgraded Scary Movie commentary. Public playback is unavailable and its relationship to the Patreon post remains intentionally unmerged.",
      sourceProof: ["official YouTube source id iMA-ZL5mi3I", "title and date verified", "member access no longer available in the current public session"]
    },
    {
      id: "patreon-43329578",
      sourceId: "43329578",
      filmId: "scary-movie",
      title: "Patreon Only SCARY MOVIE Commentary",
      date: "2020-10-30",
      provider: "Patreon",
      mediaKind: "link",
      officialUrl: "https://www.patreon.com/WeWatchedAMovie/posts/patreon-only-43329578",
      access: "member-source",
      wikiStatus: "sealed-source-brief",
      version: "2020 Patreon-only commentary",
      relationshipStatus: "separate official post; no duplicate claim",
      sourceSummary: "The official WWAM Patreon record identifies an earlier Scary Movie commentary. Without the member source, this version remains separate from the later restored upload.",
      sourceProof: ["official WWAM Patreon post id 43329578", "publication date verified", "separate version retained"]
    },
    {
      id: "patreon-63242334",
      sourceId: "63242334",
      filmId: "scary-movie-2",
      title: "SCARY MOVIE 2 Full Commentary",
      date: "2022-03-01",
      provider: "Patreon",
      mediaKind: "video embed",
      officialUrl: "https://www.patreon.com/WeWatchedAMovie/posts/scary-movie-2-63242334",
      access: "member-source",
      wikiStatus: "sealed-source-brief",
      version: "2022 full commentary",
      relationshipStatus: "official post verified; media not available to this public build",
      sourceSummary: "The official WWAM Patreon record identifies a full Scary Movie 2 commentary. No timestamped joke or verdict is promoted without the member media.",
      sourceProof: ["official WWAM Patreon post id 63242334", "publication date verified", "post media type recorded as video embed"]
    },
    {
      id: "patreon-34416138",
      sourceId: "34416138",
      filmId: "harold-kumar",
      title: "Harold and Kumar Full Patron Only Commentary",
      date: "2020-02-28",
      provider: "Patreon",
      mediaKind: "video embed",
      officialUrl: "https://www.patreon.com/WeWatchedAMovie/posts/harold-and-kumar-34416138",
      access: "member-source",
      wikiStatus: "sealed-source-brief",
      version: "2020 patron-only full commentary",
      relationshipStatus: "official post verified; media not available to this public build",
      sourceSummary: "The official WWAM Patreon record verifies a full Harold and Kumar commentary. The page supplies film context now and holds every WWAM-specific lane until source evidence arrives.",
      sourceProof: ["official WWAM Patreon post id 34416138", "publication date verified", "post media type recorded as video embed"]
    },
    {
      id: "patreon-77725076",
      sourceId: "77725076",
      filmId: "waiting",
      title: "WAITING Full Movie Commentary",
      date: "2023-01-25",
      provider: "Patreon",
      mediaKind: "video embed",
      officialUrl: "https://www.patreon.com/WeWatchedAMovie/posts/waiting-full-77725076",
      access: "member-source",
      wikiStatus: "sealed-source-brief",
      version: "2023 full commentary",
      relationshipStatus: "official post verified; media not available to this public build",
      sourceSummary: "The official WWAM Patreon record verifies a full Waiting commentary. No review, quote, or running gag is invented from the movie title alone.",
      sourceProof: ["official WWAM Patreon post id 77725076", "publication date verified", "post media type recorded as video embed"]
    }
  ];

  var queuedLanes = [
    { id: "best", label: "BEST MOMENTS", reason: "Needs source-local timestamp review." },
    { id: "up", label: "WWAM UP IN YA", reason: "Needs exact source wording and a human editorial decision." },
    { id: "steve", label: "STRAIGHT TO STEVE'S ASSHOLE", reason: "Needs a source-local negative verdict; movie reputation is not a substitute." },
    { id: "characters", label: "CHARACTER CALLBACKS", reason: "Needs an explicit performance cue; names alone do not establish a bit." },
    { id: "scenes", label: "SCENE DOORS", reason: "Needs a supplied media clock or captions." }
  ];

  root.WWAM_COMEDY_VAULT = Object.freeze({
    schema: "wwam-comedy-watchalong-vault/v1",
    generated: "2026-07-26",
    evidenceBoundary: "Official post metadata and independent film context are verified. Member media was not accessed, so WWAM recap, moment, quote, speaker, character-performance, and verdict lanes remain empty.",
    meta: {
      films: Object.keys(filmContext).length,
      officialSourceRecords: entries.length,
      publicPlayableSources: 0,
      sealedSourceBriefs: entries.length,
      inventedReceipts: 0
    },
    filmContext: filmContext,
    entries: entries.map(function (entry) {
      return Object.assign({}, entry, {
        queuedLanes: queuedLanes.map(function (lane) { return Object.assign({}, lane); }),
        receipts: [],
        speakers: [],
        recap: null
      });
    }),
    sourceFamilies: [
      {
        id: "scary-movie-version-family",
        filmId: "scary-movie",
        label: "SCARY MOVIE VERSION FILE",
        entryIds: ["patreon-43329578", "patreon-160733511", "youtube-iMA-ZL5mi3I"],
        rule: "Three official records stay separate until media comparison establishes their relationship."
      }
    ],
    contextSources: [
      "https://www.miramax.com/movie/scary-movie/",
      "https://www.miramax.com/movie/scary-movie-2/",
      "https://www.the-numbers.com/movie/Scary-Movie",
      "https://www.the-numbers.com/movie/Scary-Movie-2",
      "https://www.the-numbers.com/movie/Harold-and-Kumar-Go-to-White-Castle",
      "https://www.the-numbers.com/movie/Waiting"
    ]
  });
})(window);

