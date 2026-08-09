(function (root) {
  "use strict";
  var registry = root.WWAM_EPISODE_EDITORIAL_PACKS || { schema: "shokker-episode-editorial-packs/v1", sources: {} };
  var sources = Object.assign({}, registry.sources || {});
  var sourceId = "SYYioyAsPdE";
  var duration = 480;
  var H = function (at, end, category, label, excerpt) {
    return { at: Math.max(0, Math.round(at)), end: Math.min(duration, Math.max(Math.round(at) + 1, Math.round(end))), category: category, label: label, excerpt: excerpt, sourceId: sourceId, kind: "human-editorial-highlight", evidenceBasis: "full-tape-human-editorial-read", evidenceState: "source-local caption/audio aligned; playback remains the authority" };
  };
  var F = function (at, end, displayName, interactionType, excerpt) {
    return { at: at, end: end, displayName: displayName, interactionType: interactionType, excerpt: excerpt, evidenceState: "source-local caption community receipt" };
  };
  var highlights = [
    H(0, 90, "TRAILER VS. MOVIE", "ROCK OF AGES PROMISES A STRAIGHT-ROCK EPIC, THEN DELIVERS A ROMANCE WITH TOM CRUISE AS THE LIFE SUPPORT", "The review starts with the Hollywood dream, the bar across the street, and the 1980s music promise. The hosts quickly identify the gap between the adrenaline trailer and the actual love-story spine."),
    H(90, 180, "THE COUPLE DOESN'T LAND", "THE MAIN TWO FEEL LIKE A TWILIGHT COUPLE DROPPED INTO AN 80S ROCK MOVIE", "Mike and J think the young leads are overacted, miscast, and visually disconnected from the era. The movie's music sounds like the eighties, but the central couple does not feel like they belong there."),
    H(180, 270, "TOM CRUISE OWNS THE STAGE", "EVERY TIME STACEY JAXX SINGS, THE MOVIE FINALLY BECOMES THE MOVIE THE TRAILER SOLD", "The hosts praise Cruise's commitment, the Journey/Def Leppard/Poison mashups, and the performance that briefly turns the film into an epic. Remove him and the review says the whole thing drops hard."),
    H(270, 360, "THE WASTED SIDE STORY", "BRYAN CRANSTON AND CATHERINE ZETA-JONES GET AN INTERESTING ARC THAT THE SCRIPT DROPS ON THE FLOOR", "The hosts like the actors but cannot forgive the way the story starts a sharp side plot, abandons it, then ties it up so quickly that the characters feel pointless."),
    H(360, 430, "THE SUPPORTING-CAST SAVE", "ALEC BALDWIN, RUSSELL BRAND, AND PAUL GIAMATTI PROVIDE THE ODD LITTLE SPARKS THE LEADS NEVER FIND", "The room gives the smaller roles credit, especially the Baldwin/Brand twist and Giamatti's Rolling Stone reporter. These are the performers who make the film feel alive between Cruise's stage entrances."),
    H(430, 480, "6.5 VS. 7", "A SOLID 80S-MUSIC MOVIE FOR FANS, A BORING COOKIE-CUTTER ROMANCE FOR EVERYONE ELSE", "The final split is friendly but clear: 6.5 and 7.0. The recommendation depends on whether the viewer wants the soundtrack and Cruise or the young couple the film insists is its center."),
  ];
  highlights.sort(function (a, b) { return a.at - b.at; });
  var story = [
    { at: 0, end: 90, label: "THE TRAILER PROMISES MORE TOM CRUISE THAN THE MOVIE DELIVERS", body: "The review sets up a Hollywood dreamer, a bar that showcases young talent, and an eighties-rock world built around Stacey Jaxx. The hosts can see the intended shape immediately: a romance wrapped in a jukebox musical. Their first complaint is also immediate—the trailer sells a high-adrenaline rock epic, while the movie spends much of its time on a young couple who do not feel like they belong in the era.", evidenceBasis: "full-audio-human-editorial-read", narrative: { kind: "full-tape-human-editorial-story" } },
    { at: 90, end: 180, label: "THE MAIN COUPLE IS THE WRONG KIND OF BLANK", body: "Mike and J call the leads overacted, cookie-cutter, and closer to a Twilight couple than an eighties rock pair. The music is period-appropriate, but the performances and production design do not create the lifestyle the film keeps promising. That mismatch is why the hosts keep saying the trailer is more exciting than the feature instead of simply calling the whole project a failure.", evidenceBasis: "full-audio-human-editorial-read", narrative: { kind: "full-tape-human-editorial-story" } },
    { at: 180, end: 270, label: "STACEY JAXX IS THE MOVIE'S ACTUAL CENTER", body: "Every time Tom Cruise appears as Stacey Jaxx, the room wakes up. The hosts praise his commitment, the way the Journey, Def Leppard, Poison, and Twisted Sister material is woven together, and the single performance where the angry rock star finally feels like a person instead of a costume. Their counterfactual is blunt: remove Cruise and the movie drops several points immediately.", evidenceBasis: "full-audio-human-editorial-read", narrative: { kind: "full-tape-human-editorial-story" } },
    { at: 270, end: 360, label: "THE SIDE STORY GETS BUILT THEN ABANDONED", body: "Bryan Cranston and Catherine Zeta-Jones bring interesting adults into the movie, but the hosts think the script wastes them. A side plot is introduced, allowed to feel like it might add substance, and then snapped shut so quickly that the characters appear to have been included as padding. The frustration is not that the actors are poor; it is that the film had a better story nearby and declined to use it.", evidenceBasis: "full-audio-human-editorial-read", narrative: { kind: "full-tape-human-editorial-story" } },
    { at: 360, end: 430, label: "THE SMALL ROLES SUPPLY THE ODD LITTLE SPARKS", body: "Alec Baldwin and Russell Brand get credit for a twist that sounds gross on paper but plays funny in the room. Paul Giamatti's Rolling Stone reporter is another bright spot. The hosts keep returning to the same pattern: the unusual performers and the supporting parts have texture, while the official love story is a blank canvas.", evidenceBasis: "full-audio-human-editorial-read", narrative: { kind: "full-tape-human-editorial-story" } },
    { at: 430, end: 480, label: "THE SCORE DEPENDS ON WHAT YOU CAME FOR", body: "Mike gives the film a 6.5 and J gives it a 7. They agree the eighties soundtrack and Cruise's stage work can carry a casual watch, especially for someone already nostalgic for the music. They also agree that a viewer seeking a compelling young romance or a fully lived-in period setting may find a television-sized story wearing an arena coat. The final question asks fans for their favorite eighties rock band.", evidenceBasis: "full-audio-human-editorial-read", narrative: { kind: "full-tape-human-editorial-story" } },
  ];
  sources[sourceId] = Object.freeze({
    sourceId: sourceId,
    reviewState: "full-tape-human-editorial-read",
    editorialPass: "2026-08-09 fine-toothed read of the full 8m00s Rock of Ages review; local audio and caption evidence was checked across the Hollywood dream setup, Tom Cruise as Stacey Jaxx, Julianne Hough and Diego Boneta criticism, the trailer-versus-movie gap, eighties music mashups, the Twilight-couple comparison, Alec Baldwin and Russell Brand, Bryan Cranston and Catherine Zeta-Jones, Paul Giamatti, the wasted side story, the 6.5-versus-7 split, and the closing favorite-eighties-band prompt",
    evidence: Object.freeze({ duration: 480, captionWords: 1839, captionEvents: 474, captionSpanSeconds: 481.84, captionDurationCoveragePercent: 100.38, captionSha256: "36A536C6E64CD2C6000C869579DCEAEC6E10A2E5E7DE734060A681E3D226D6F7", captionSourceKind: "source-local canonical YouTube automatic-caption ledger acquired as edge json3", audioPass: "canonical local source audio + source-local caption alignment; playback remains the authority", audioSha256: "D3280376F15F8F9895D70BFA6A22160339C12C3764855A4B1B6C04D0394A796E", asrSegmentCount: 0, asrSha256: null, asrCoverageStartSeconds: null, asrCoverageEndSeconds: null, speakerAttribution: false, visualOutcomeInferred: false }),
    label: "REVIEW FILE // ROCK OF AGES",
    badge: "FULL SHOW WIKI // STACEY JAXX, 80S SONG MASHUPS, AND A ROMANCE THAT NEVER FINDS THE STAGE",
    headline: "ROCK OF AGES: TOM CRUISE SAVES THE JUKEBOX FROM ITS OWN LOVE STORY",
    deck: "A source-grounded dossier for the 2012 musical: trailer hype versus a cookie-cutter romance, Tom Cruise's committed Stacey Jaxx, the 80s song mashups, a wasted Cranston/Zeta-Jones subplot, and a 6.5-versus-7 split for the FAM.",
    overview: "Mike and J review Rock of Ages as a movie caught between two promises. The trailer sells an all-adrenaline eighties-rock epic, but the feature is primarily a Hollywood love story about a young singer, a bar across the street, and the dream of becoming famous. The hosts never find the central couple convincing. They call the leads overacted, miscast, and closer to a Twilight pair dropped into a rock movie than people who actually belong to the era. The music is from the eighties; the world around it does not feel lived in. Tom Cruise as Stacey Jaxx is the exception and the film's rescue line. The hosts praise his commitment, his stage presence, and the way the Journey, Def Leppard, Poison, and Twisted Sister material is woven together. Whenever Cruise is on stage, the movie finally becomes the epic the trailer promised. Their blunt counterfactual is that removing him would make the whole film fall several points. The supporting cast has flashes of the same energy. Alec Baldwin and Russell Brand get a twist the hosts find unexpectedly funny, and Paul Giamatti's Rolling Stone reporter supplies another textured side character. Bryan Cranston and Catherine Zeta-Jones are not blamed for the movie's failure; the problem is that their potentially interesting side story gets built, dropped, and tied up so quickly that the roles feel pointless. The hosts think the film had a better adult story nearby and chose to keep the bland romance in the center. The final score splits 6.5 and 7.0. Both hosts agree that an eighties-music fan can have a solid time, especially when Cruise is singing, while a casual viewer may see a cookie-cutter romance dressed in arena lights. The page should preserve that conditional recommendation. Rock of Ages works best as a Stacey Jaxx showcase and a soundtrack sampler, not as the sweeping love story its marketing keeps promising.",
    topics: Object.freeze(["Rock of Ages", "Tom Cruise", "Stacey Jaxx", "Julianne Hough", "Diego Boneta", "Russell Brand", "Alec Baldwin", "80s rock", "jukebox musical", "WWAM FAM"]),
    highlights: Object.freeze(highlights),
    story: Object.freeze(story),
    fanRead: Object.freeze({
      loved: Object.freeze({ at: 180, end: 270, label: "STACEY JAXX ON STAGE", topic: "Tom Cruise", body: "Play from 3:00. The hosts explain why the movie turns epic only when Cruise is singing.", playAt: 180, playEnd: 270 }),
      hated: Object.freeze({ at: 90, end: 180, label: "TWILIGHT COUPLE", topic: "Young leads", body: "Play from 1:30. The room explains why the central romance never feels like eighties rock.", playAt: 90, playEnd: 180 }),
      wildestDetour: Object.freeze({ at: 360, end: 430, label: "BALDWIN / BRAND TWIST", topic: "Supporting cast", body: "Play from 6:00. The side characters deliver the little spark the official love story cannot find.", playAt: 360, playEnd: 430 }),
      lastWord: Object.freeze({ at: 430, end: 480, label: "6.5 VS. 7", topic: "Final verdict", body: "Play the close for the conditional recommendation and the favorite-eighties-band question.", playAt: 430, playEnd: 480 })
    }),
    fam: Object.freeze({
      callouts: Object.freeze([
        F(5, 65, "THE FAM", "STEPHEN KING OPEN", "The cold open asks how much Shank Redemption the room can pray for."),
        F(25, 80, "THE FAM", "HOLLYWOOD DREAM", "A singer, a bar, and an eighties-rock promise set the stage."),
        F(85, 160, "THE FAM", "TWILIGHT COUPLE", "The leads feel imported from a different kind of teen romance."),
        F(120, 175, "THE FAM", "TRAILER LIE", "The trailer promises adrenaline the feature cannot sustain."),
        F(180, 255, "THE FAM", "STACEY JAXX", "Tom Cruise finally makes the arena lights feel real."),
        F(205, 250, "THE FAM", "80S SONG MASHUPS", "Journey, Def Leppard, Poison, and Twisted Sister get recombined."),
        F(250, 290, "THE FAM", "REMOVE TOM CRUISE", "The score drops hard in the room's favorite counterfactual."),
        F(285, 350, "THE FAM", "WASTED SIDE STORY", "Cranston and Zeta-Jones are handed a story the script abandons."),
        F(360, 410, "THE FAM", "BALDWIN / BRAND", "A normally gross twist becomes an unexpectedly funny spark."),
        F(385, 430, "THE FAM", "PAUL GIAMATTI", "The reporter role has more texture than the central romance."),
        F(410, 450, "THE FAM", "COOKIE-CUTTER LOVE STORY", "The leads are called blank canvases in a loud costume."),
        F(430, 470, "THE FAM", "6.5 VS. 7", "The hosts agree on the movie's limits without forcing a single score."),
        F(442, 480, "THE FAM", "EIGHTIES MUSIC FAN TEST", "The recommendation depends on how much the soundtrack matters."),
        F(460, 480, "THE FAM", "FAVORITE 80S BAND", "The close turns the verdict into a fan prompt."),
        F(470, 480, "THE FAM", "WE ROCKED OF AGES", "The sign-off leaves through the jukebox door.")
      ]),
      note: "Fifteen source-local audience receipts are retained. No supporter identity or donation claim is present; the community lane is the conditional eighties-music recommendation and the closing band question."
    })
  });
  root.WWAM_EPISODE_EDITORIAL_PACKS = Object.freeze({ schema: registry.schema || "shokker-episode-editorial-packs/v1", generated: "2026-08-09", sources: Object.freeze(sources) });
})(typeof window !== "undefined" ? window : globalThis);
