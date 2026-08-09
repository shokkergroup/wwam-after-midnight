(function (root) {
  "use strict";
  var registry = root.WWAM_EPISODE_EDITORIAL_PACKS || { schema: "shokker-episode-editorial-packs/v1", sources: {} };
  var sources = Object.assign({}, registry.sources || {});
  var sourceId = "-jTbmZb2EvE";
  var duration = 1178;
  var H = function (at, end, category, label, excerpt) {
    return { at: Math.max(0, Math.round(at)), end: Math.min(duration, Math.max(Math.round(at) + 1, Math.round(end))), category: category, label: label, excerpt: excerpt, sourceId: sourceId, kind: "human-editorial-highlight", evidenceBasis: "full-tape-human-editorial-read", evidenceState: "source-local audio + local ASR aligned; playback remains the authority" };
  };
  var highlights = [
    H(0, 250, "WWAM UP IN YA", "BLINK-182, AUTO-TUNE, AND THE MISSION FROM GOD", "The Seed of Chucky watchalong opens with Blink-182, Lil Wayne, auto-tune, and the hosts admitting they are about to watch a movie nobody in the room wants."),
    H(250, 430, "STRAIGHT TO STEVE'S ASSHOLE", "THE JAPANESE BABY, JENNIFER TILLY, AND THE PAUSE BUTTON", "The opening reveal is misread, the movie freezes, and the live room discovers that liveness means the technical failure is now part of the joke."),
    H(430, 650, "BEST MOMENT", "CHUCKY'S CUP, THE PLASTIC DICK, AND THE DIRECTOR'S DECISION", "Chucky's masturbation scene earns the most incredulous reaction on the tape, including a detailed audit of what exactly is in the cup."),
    H(650, 850, "WWAM UP IN YA", "THREE-WAY PHONE CALLS, BUD LIGHT, AND GOD REJECTING THE MOVIE", "The film pauses repeatedly, a three-way phone conversation gets compared with old Bud Light commercials, and the computer seems to refuse the movie on moral grounds."),
    H(850, 1050, "TAKE GETS NUCLEAR", "CHUCKY'S LIMBS, CHUCK CHICKEN BONE, AND THE WORST MOVIE", "After a kitchen-nightmares detour, the hosts watch Chucky lose limbs and declare Seed the worst entry in the series."),
    H(1050, 1178, "LAST CALL", "THE CURSE/CULT SURVIVAL PLAN", "The movie finally ends, the hosts promise Curse and Cult are better, and the drained room describes the watchalong as an American flag waiting for a rocket launch."),
  ];
  highlights.sort(function (a, b) { return a.at - b.at; });
  var story = [
    { at: 0, end: 430, label: "THE MISSION FROM GOD MEETS A MOVIE NOBODY WANTS", body: "Seed of Chucky begins with Blink-182, Lil Wayne, auto-tune, and a mission-from-God declaration before the hosts press play on a movie they openly expect to hate. The classic cue is rebuilt, the first reveal gets interpreted as a Japanese parent having sex with Jennifer Tilly, and the movie immediately freezes. That technical interruption is not hidden. It becomes the first proof that this watchalong is live, unstable, and willing to let the movie lose a fight with the computer before the booth has even found its rhythm.", evidenceBasis: "full-audio-human-editorial-read", narrative: { kind: "full-audio-human-editorial-story" } },
    { at: 430, end: 850, label: "THE CUP, THE THREE-WAY CALL, AND GOD'S REJECTION", body: "The Chucky masturbation sequence is the point where the commentary stops asking what the filmmakers intended and starts asking who approved the cup. The hosts inspect the plastic anatomy, imagine Michael doing the same thing, and treat the scene as evidence that the franchise has left horror for a dare. More freezes follow. A three-way phone call gets compared with Bud Light's What's up commercials, and the computer is described as morally rejecting the film. The technical problems are not an interruption to the episode. They are the episode's most honest review of the movie's structure.", evidenceBasis: "full-audio-human-editorial-read", narrative: { kind: "full-audio-human-editorial-story" } },
    { at: 850, end: 1050, label: "KITCHEN NIGHTMARES AND CHUCKY'S LIMB INVENTORY", body: "The source disappears, a Kitchen Nightmares detour appears by accident, and then the movie returns long enough to remove Chucky's arms and legs. The hosts call the villain Chuck Chicken Bone, invoke Ronald McDonald, and admit they have no words left. Seed of Chucky is not merely disliked. It is described as an endurance event that has drained the audience's ability to form a normal sentence.", evidenceBasis: "full-audio-human-editorial-read", narrative: { kind: "full-audio-human-editorial-story" } },
    { at: 1050, end: 1178, label: "CURSE AND CULT AS THE LIGHT AT THE END", body: "The movie finally ends, and the room promises that Curse of Chucky and Cult of Chucky will make the franchise feel alive again. The relief is physical: the hosts describe being drained, needing a preparation period, and wanting an American flag wrapped around them before the next rocket launch. The verdict is tiny but definitive. This is the low point the later Chucky canon has to climb out of.", evidenceBasis: "full-audio-human-editorial-read", narrative: { kind: "full-audio-human-editorial-story" } },
  ];
  sources[sourceId] = Object.freeze({
    sourceId: sourceId,
    reviewState: "full-tape-human-editorial-read",
    editorialPass: "2026-08-09 fine-toothed full-audio read of the 19m38s Seed of Chucky follow-up; local audio, canonical captions, and Whisper ledger checked across Blink-182/Lil Wayne opening, auto-tune, mission-from-God line, sucking/fucking/touching cue, Jennifer Tilly reveal, movie freeze, liveness and pause-button failure, Chucky masturbation cup, Bud Light What's Up comparison, repeated playback failure, Kitchen Nightmares detour, Chucky limb removal, Chuck Chicken Bone, Ronald McDonald gag, Seed as worst Chucky movie verdict, Curse and Cult survival plan, and drained American-flag rocket sign-off",
    evidence: Object.freeze({ duration: 1178, captionWords: 1361, captionEvents: 810, captionSpanSeconds: 1142.39, captionDurationCoveragePercent: 97, captionSha256: "F29B007302A471458420CF11DD7EB283390D369DDECBB0A4C9D162FBABBEF345", captionSourceKind: "source-local canonical YouTube automatic-caption ledger + local Whisper ledger", audioPass: "canonical local source audio + local Whisper alignment; playback remains the authority", audioSha256: "E73A708AF8FE7A39A2DA5112550920FE36E7533408355887DFADF5483D6C7410", asrSegmentCount: 261, asrSha256: "A2AFCB3D03E53967EFF82EB4FDAE3D14954CAAD75DEDE36F9F5826142E5299CD", asrCoverageStartSeconds: 48, asrCoverageEndSeconds: 1116.34, speakerAttribution: false, visualOutcomeInferred: false }),
    label: "SEED OF CHUCKY // HERE'S WHAT HAPPENED NEXT",
    badge: "SHORT FOLLOW-UP WIKI // AUTO-TUNE, THE CUP, GOD'S PAUSE BUTTON, CHUCK CHICKEN BONE, AND THE CURSE/CULT EXIT",
    headline: "THE COMPUTER TRIES TO SAVE THEM FROM SEED OF CHUCKY",
    deck: "A full-audio WWAM short on Seed of Chucky: Blink-182, a frozen movie, the cup nobody wanted to inspect, and the promise that Curse and Cult can still rescue the franchise.",
    overview: "The Seed of Chucky follow-up begins with Blink-182, Lil Wayne, auto-tune, and a mission-from-God declaration before the hosts press play on a movie they openly expect to hate. The opening reveal is misread, the movie freezes, and the liveness of the watchalong becomes the first running joke. Chucky's masturbation scene then turns the room into an evidence locker: what is in the cup, who approved the plastic anatomy, and why is the villain being treated like a dare? More playback failures follow, a three-way phone call becomes a Bud Light comparison, and the computer is described as rejecting the film on moral grounds. A Kitchen Nightmares detour interrupts the missing source before Chucky loses his arms and legs, becomes Chuck Chicken Bone, and gets declared the worst entry in the series. The movie finally ends with Curse of Chucky and Cult of Chucky offered as the light at the end, leaving the hosts drained enough to request two weeks of preparation and an American flag before the next rocket launch. No speaker is assigned to any line; local audio and ASR establish bounded routes, with playback remaining the authority.",
    topics: Object.freeze(["Seed of Chucky", "Chucky", "Jennifer Tilly", "Blink-182", "Lil Wayne", "Curse of Chucky", "Cult of Chucky", "Brad Dourif", "Kitchen Nightmares"]),
    highlights: Object.freeze(highlights),
    story: Object.freeze(story),
    fanRead: Object.freeze({
      loved: Object.freeze({ at: 650, end: 850, label: "GOD REJECTS THE MOVIE", topic: "Technical chaos", body: "Play the repeated pauses and Bud Light phone-call stretch for the strongest liveness evidence: the computer seems to hate the film as much as the room does.", playAt: 650, playEnd: 850 }),
      hated: Object.freeze({ at: 430, end: 650, label: "THE CUP", topic: "Chucky's lowest point", body: "Play the masturbation scene for the booth's most direct question about who approved the movie's plastic anatomy.", playAt: 430, playEnd: 650 }),
      wildestDetour: Object.freeze({ at: 850, end: 1050, label: "CHUCK CHICKEN BONE", topic: "Limb removal", body: "Play the Kitchen Nightmares detour and limb inventory for the point where the movie loses its name and the booth loses its patience.", playAt: 850, playEnd: 1050 }),
      lastWord: Object.freeze({ at: 1050, end: 1178, label: "CURSE AND CULT AS RESCUE", topic: "Franchise recovery", body: "Play the close for the drained verdict and the promise that the next two Chucky films can pull the series back from the edge.", playAt: 1050, playEnd: 1178 })
    }),
    fam: Object.freeze({
      callouts: Object.freeze([]),
      note: "No named fan, Super Chat, donation, or community receipt is clearly audible in this short follow-up. The FAM lane stays empty rather than inventing one."
    })
  });
  root.WWAM_EPISODE_EDITORIAL_PACKS = Object.freeze({ schema: registry.schema || "shokker-episode-editorial-packs/v1", generated: "2026-08-09", sources: Object.freeze(sources) });
})(typeof window !== "undefined" ? window : globalThis);
