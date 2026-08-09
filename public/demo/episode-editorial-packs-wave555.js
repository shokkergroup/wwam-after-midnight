(function (root) {
  "use strict";
  var registry = root.WWAM_EPISODE_EDITORIAL_PACKS || { schema: "shokker-episode-editorial-packs/v1", sources: {} };
  var sources = Object.assign({}, registry.sources || {});
  var sourceId = "ot91NhcRSdM";
  var duration = 836;
  var H = function (at, end, category, label, excerpt) {
    return { at: Math.max(0, Math.round(at)), end: Math.min(duration, Math.max(Math.round(at) + 1, Math.round(end))), category: category, label: label, excerpt: excerpt, sourceId: sourceId, kind: "human-editorial-highlight", evidenceBasis: "full-tape-human-editorial-read", evidenceState: "source-local audio + local ASR aligned; playback remains the authority" };
  };
  var highlights = [
    H(0, 170, "WWAM UP IN YA", "KENTUCKY, THE ARMREST, AND THE WRONG EARBUD", "The short follow-up opens in Kentucky, argues about an armrest, admits the earbud is backwards, and rebuilds the classic sucking, fucking, touching cue."),
    H(170, 330, "BEST MOMENT", "JERRY FROM FRIGHT NIGHT AND THE GOOD GUY DOLL", "The booth recognizes Jerry from Fright Night, then turns a child wanting a Good Guy doll into a parents-will-do-anything-for-a-toy autopsy."),
    H(330, 480, "STRAIGHT TO STEVE'S ASSHOLE", "CHUCKY'S TOOL CHEST, THE ARMY PLAN, AND FATALITY", "A tool chest, silent soldiers, a swing-set insult, and a rigged kill turn the reaction into a tiny military briefing with a Mortal Kombat finish."),
    H(480, 610, "WWAM UP IN YA", "CHUCKY'S ROUGH VOICE, CRISS ANGEL, AND THE GROCERY TRIP", "Chucky's voicing gets praised, Criss Angel appears in the room, and a second grocery trip becomes a full marital assault."),
    H(610, 735, "BEST MOMENT", "THE DOG, THE LIGHTS, AND THE CAT BUSINESS", "The dog gets scared, knocks over the lights, and leaves the booth trying to reconstruct what happened while the cat looks like it has a separate agenda."),
    H(735, 836, "LAST CALL", "TITANUS, WHITE CANCER, AND SOMETIMES DEAD IS BETTER", "The ending turns bad lighting, a white mark, and the phrase sometimes dead is better into a compact WWAM sign-off."),
  ];
  highlights.sort(function (a, b) { return a.at - b.at; });
  var story = [
    { at: 0, end: 330, label: "THE FOLLOW-UP STARTS WITH A BROKEN EARBUD", body: "This short Child's Play follow-up is less a formal review than a reaction room that has been dropped into the middle of a larger archive. Kentucky, a disputed armrest, a backwards earbud, and the sucking, fucking, touching start cue establish the compact format. Jerry from Fright Night gets recognized, then the Good Guy doll becomes the first serious question: how far will parents go to make a child happy, and how much of the price is just people overcharging for a piece of plastic? The booth answers with the only currency it has—filthy jokes and a fake article about bullshit.", evidenceBasis: "full-audio-human-editorial-read", narrative: { kind: "full-audio-human-editorial-story" } },
    { at: 330, end: 610, label: "CHUCKY GETS A MILITARY BRIEFING AND A VOICE CREDIT", body: "The reaction's middle is a rapid escalation. Someone asks why the soldiers are walking around silently; the answer is to stand up and shoot, followed by a swing-set insult and a Mortal Kombat fatality. Chucky's rough voice earns real approval, Criss Angel appears as a visual comparison, and a second grocery trip becomes a domestic crime scene. The short runtime is the point: every minute has to become a bit before the doll can finish the scene.", evidenceBasis: "full-audio-human-editorial-read", narrative: { kind: "full-audio-human-editorial-story" } },
    { at: 610, end: 735, label: "THE DOG KNOCKS OVER THE LIGHTS", body: "The most genuinely unpredictable moment arrives from outside the movie. The dog gets scared, the lights fall, the cat appears to have a business question, and the hosts spend the next minute trying to reconstruct the accident. The archive's live-wire feeling survives because the room is not pretending the recording is controlled. The interruption becomes the best scene in the short.", evidenceBasis: "full-audio-human-editorial-read", narrative: { kind: "full-audio-human-editorial-story" } },
    { at: 735, end: 836, label: "WHITE CANCER AND SOMETIMES DEAD IS BETTER", body: "The close turns strange lighting and a white mark into a fake medical diagnosis, then drops the phrase sometimes dead is better as the final button. It is not a full franchise thesis. It is a little shard of WWAM behavior: notice the weird image, make it vulgar, remember the horror line, and leave before the bit has time to become respectable.", evidenceBasis: "full-audio-human-editorial-read", narrative: { kind: "full-audio-human-editorial-story" } },
  ];
  sources[sourceId] = Object.freeze({
    sourceId: sourceId,
    reviewState: "full-tape-human-editorial-read",
    editorialPass: "2026-08-09 fine-toothed full-audio read of the 13m56s Child's Play follow-up; local audio, canonical captions, and Whisper ledger checked across Kentucky opening, armrest argument, backwards earbud, sucking/fucking/touching cue, Jerry from Fright Night recognition, Good Guy doll and parent-spending tangent, Chucky tool chest, silent-army plan, Fatality line, Brad Dourif voice praise, Criss Angel comparison, grocery-trip marital bit, dog and light accident, cat interruption, Titanus joke, white-mark diagnosis, and Sometimes Dead Is Better sign-off",
    evidence: Object.freeze({ duration: 836, captionWords: 1074, captionEvents: 324, captionSpanSeconds: 800.96, captionDurationCoveragePercent: 96, captionSha256: "CFFBD1E5881132833E0EE97D9A1A440B5B15E21C99249B3596C06BAC6802A233F", captionSourceKind: "source-local canonical YouTube automatic-caption ledger + local Whisper ledger", audioPass: "canonical local source audio + local Whisper alignment; playback remains the authority", audioSha256: "17A2C5E2264517087DC42615041BCBA37FF49930817ADA60986015F1C5E3DB82", asrSegmentCount: 206, asrSha256: "280620F8E7290927BF561474756C43A051CD8F35D72BC3775B1064C8CFBA4CAF", asrCoverageStartSeconds: 9, asrCoverageEndSeconds: 790.3, speakerAttribution: false, visualOutcomeInferred: false }),
    label: "CHILD'S PLAY // HERE'S WHAT HAPPENED NEXT",
    badge: "SHORT FOLLOW-UP WIKI // JERRY FROM FRIGHT NIGHT, GOOD GUY DOLL, DOG-CAUSED BLACKOUT, AND SOMETIMES DEAD IS BETTER",
    headline: "THE DOG INTERRUPTS CHUCKY'S NEXT LITTLE WAR",
    deck: "A full-audio WWAM short: a backwards earbud, a Good Guy doll, a Chucky military briefing, a dog-caused lighting disaster, and a compact horror sign-off.",
    overview: "This 13-minute Child's Play follow-up is a compact reaction room rather than a formal plot recap. It opens in Kentucky with an armrest argument, a backwards earbud, and the sucking, fucking, touching cue before recognizing Jerry from Fright Night and questioning why parents will overpay for a Good Guy doll. Chucky's tool chest becomes a military briefing, the silent soldiers get ordered to stand up and shoot, and a Mortal Kombat fatality line turns the kill into a button. The booth praises Brad Dourif's rough voice, compares a face to Criss Angel, and turns a second grocery trip into a marital assault. Then the dog gets scared and knocks over the lights, leaving the room to reconstruct the accident while a cat seems to have its own business. The last minute offers fake Titanus and white-cancer diagnoses before landing on sometimes dead is better. No speaker is assigned to any line; local audio and ASR establish bounded routes, with playback remaining the authority.",
    topics: Object.freeze(["Child's Play", "Chucky", "Good Guy doll", "Brad Dourif", "Fright Night", "Criss Angel", "Mortal Kombat", "Kentucky"]),
    highlights: Object.freeze(highlights),
    story: Object.freeze(story),
    fanRead: Object.freeze({
      loved: Object.freeze({ at: 610, end: 735, label: "THE DOG KNOCKS OVER THE LIGHTS", topic: "Unplanned room chaos", body: "Play the dog and light accident for the most genuinely unpredictable moment in the short.", playAt: 610, playEnd: 735 }),
      hated: Object.freeze({ at: 480, end: 610, label: "THE SECOND GROCERY TRIP", topic: "Domestic tangent", body: "Play the grocery and Criss Angel stretch for the room's most aggressive side quest.", playAt: 480, playEnd: 610 }),
      wildestDetour: Object.freeze({ at: 330, end: 480, label: "THE SILENT ARMY AND FATALITY", topic: "Chucky tactics", body: "Play the tool-chest and soldier stretch for the tiny war movie the booth invents around the doll.", playAt: 330, playEnd: 480 }),
      lastWord: Object.freeze({ at: 735, end: 836, label: "SOMETIMES DEAD IS BETTER", topic: "Horror button", body: "Play the close for the fake diagnosis, strange lighting, and final horror quotation.", playAt: 735, playEnd: 836 })
    }),
    fam: Object.freeze({
      callouts: Object.freeze([]),
      note: "No named fan, Super Chat, donation, or community receipt is clearly audible in this short follow-up. The FAM lane stays empty rather than promoting unverified caption fragments."
    })
  });
  root.WWAM_EPISODE_EDITORIAL_PACKS = Object.freeze({ schema: registry.schema || "shokker-episode-editorial-packs/v1", generated: "2026-08-09", sources: Object.freeze(sources) });
})(typeof window !== "undefined" ? window : globalThis);
