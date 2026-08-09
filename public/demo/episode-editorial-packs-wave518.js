(function (root) {
  "use strict";
  var registry = root.WWAM_EPISODE_EDITORIAL_PACKS || { schema: "shokker-episode-editorial-packs/v1", sources: {} };
  var sources = Object.assign({}, registry.sources || {});
  var sourceId = "Fj50y_8mNAk";
  var duration = 284;
  var H = function (at, end, category, label, excerpt) {
    return { at: Math.max(0, Math.round(at)), end: Math.min(duration, Math.max(Math.round(at) + 1, Math.round(end))), category: category, label: label, excerpt: excerpt, sourceId: sourceId, kind: "human-editorial-highlight", evidenceBasis: "full-tape-human-editorial-read", evidenceState: "source-local caption/audio aligned; playback remains the authority" };
  };
  var F = function (at, end, displayName, interactionType, excerpt) {
    return { at: at, end: end, displayName: displayName, interactionType: interactionType, excerpt: excerpt, evidenceState: "source-local caption community receipt" };
  };
  var highlights = [
    H(0, 60, "SHITTY-LIFE CAMERA", "THREE KIDS FIND AN UNDERGROUND OBJECT, GET TELEKINESIS, AND TURN A SHITTY LIFE INTO A SAFETY NET", "The review explains Andrew's abuse, bullying, dying mother, and camera as a record of a life he cannot control. The powers do not create his anger; they give it a way out."),
    H(60, 120, "FOUND-FOOTAGE ARGUMENT", "X-MEN MEETS CLOVERFIELD MEETS THE GOONIES, WITH MIKE STILL ASKING IF TELEKINESIS IS A WORD", "The hosts place Chronicle inside the found-footage lineage, then praise it for giving the format a new direction instead of repeating ghosts, monsters, or shaky home-video panic."),
    H(120, 180, "THE CAMERA FLIES", "HD, KODAK, AND IMPOSSIBLE ANGLES MAKE THE POWER SEQUENCES FEEL LIKE A REAL DISCOVERY", "The action changes the room's expectations. The hosts credit the director, effects, and cinematography for making telekinesis readable and exciting through a camera that should not be able to float."),
    H(180, 230, "THE B IS NOT AN INSULT", "A GREAT MOVIE GETS A SOLID B BECAUSE THE CHARACTERS AND ENDING NEEDED TWENTY MORE MINUTES", "Mike wants more development and a longer ending. J agrees the score is fair: the movie is impressive, satisfying, and still short of the emotional attachment the hosts wanted."),
    H(230, 265, "THEATER RECOMMENDATION", "GO SEE IT IN THE THEATER—THEN USE YOUR TELEKINESIS TO CLICK SUBSCRIBE", "The main review strongly recommends the film for a theater, especially for the effects and found-footage craft."),
    H(265, 284, "PLOT-TWIST BUTTON", "THE OUTRO SAYS 'FOUND FOOTAGE' UNTIL A MAJOR TWIST TURNS THE CAMERA INTO A DIFFERENT KIND OF EVIDENCE", "The post-review tag plays with the genre label, repeats 'footage,' and teases a twist that changes how the footage was found. It is a small meta-sketch that belongs beside the main recommendation."),
  ];
  highlights.sort(function (a, b) { return a.at - b.at; });
  var story = [
    { at: 0, end: 60, label: "THE POWER COMES FROM A LIFE ALREADY FULL OF DAMAGE", body: "Chronicle begins with three high-school kids finding an unexplained object underground and gaining telekinesis. The hosts focus on Andrew, whose father beats him, classmates bully him, and mother is dying. His camera is a safety net, a way to record a life he cannot fix. The power does not invent his anger; it gives the anger reach. That is why the movie has more weight than a simple effects exercise.", evidenceBasis: "full-audio-human-editorial-read", narrative: { kind: "full-tape-human-editorial-story" } },
    { at: 60, end: 120, label: "THE FOUND-FOOTAGE FORMAT GETS A NEW DIRECTION", body: "The room compares Chronicle to X-Men, Cloverfield, The Goonies, Blair Witch, and Paranormal Activity. Mike keeps asking whether telekinesis is a word, but the editorial point is serious: the film takes a format associated with ghosts and monsters and uses it for superpowers. Hollywood may be exhausting found footage, but this one still changes the question being asked.", evidenceBasis: "full-audio-human-editorial-read", narrative: { kind: "full-tape-human-editorial-story" } },
    { at: 120, end: 180, label: "THE CAMERA SHOULD NOT BE ABLE TO DO THIS", body: "When the action escalates, the hosts are impressed by the camera angles, high-definition image, effects, and director's ability to keep telekinesis legible. The floating camera becomes part of the spectacle instead of a technical excuse. Their praise is unusually concrete: the film makes them wonder how the shot is happening, then lets them enjoy the answer without abandoning the characters.", evidenceBasis: "full-audio-human-editorial-read", narrative: { kind: "full-tape-human-editorial-story" } },
    { at: 180, end: 230, label: "THE SCORE IS A REQUEST FOR MORE MOVIE", body: "Mike gives Chronicle a B because the final stretch ends before he is ready to leave the characters. J agrees that B is a solid score, not a punishment. The beginning needs more time for development and the ending needs more time to breathe, but the existing film still leaves the theater feeling satisfied and impressed.", evidenceBasis: "full-audio-human-editorial-read", narrative: { kind: "full-tape-human-editorial-story" } },
    { at: 230, end: 265, label: "THE THEATER IS THE RIGHT ROOM", body: "The main review strongly recommends seeing Chronicle in a theater. The effects, camera work, and the sensation of watching a found object become a superpower story are all larger in that setting. The hosts use the recommendation as the call to action: use your telekinesis to click subscribe.", evidenceBasis: "full-audio-human-editorial-read", narrative: { kind: "full-tape-human-editorial-story" } },
    { at: 265, end: 284, label: "THE OUTRO QUESTIONS WHAT 'FOUND' MEANS", body: "The tag keeps repeating that Chronicle is footage that was found, then teases a major plot turn that changes how the viewer should think about that word. The captions trail off as a playful end-card bit, but it is worth preserving as a separate WWAM moment rather than blending it into the score.", evidenceBasis: "full-audio-human-editorial-read", narrative: { kind: "full-tape-human-editorial-story" } },
  ];
  sources[sourceId] = Object.freeze({
    sourceId: sourceId,
    reviewState: "full-tape-human-editorial-read",
    editorialPass: "2026-08-09 fine-toothed read of the full 4m44s Chronicle review; local audio and caption evidence was checked across Andrew's abusive home and bullying, the underground object, telekinesis, camera as safety net, X-Men/Cloverfield/Goonies comparison, found-footage lineage, Kodak HD camera, director and effects praise, too-long and too-short sections, B grade, theater recommendation, telekinesis subscribe cue, repeated footage tag, and major twist tease",
    evidence: Object.freeze({ duration: 284, captionWords: 1136, captionEvents: 290, captionSpanSeconds: 280.12, captionDurationCoveragePercent: 98.63, captionSha256: "ED6EE3C080FBC7E0CB4D2AFFD1D14BD0E077AB4D545230820A57E2FF4D5CA35F", captionSourceKind: "source-local canonical YouTube automatic-caption ledger acquired as edge json3", audioPass: "canonical local source audio + source-local caption alignment; playback remains the authority", audioSha256: "018B50EF486ED487C9EFA91A3067AB99ADF29B51381EBEBF35AF8F22F68AD961", asrSegmentCount: 0, asrSha256: null, asrCoverageStartSeconds: null, asrCoverageEndSeconds: null, speakerAttribution: false, visualOutcomeInferred: false }),
    label: "REVIEW FILE // CHRONICLE",
    badge: "FULL SHOW WIKI // TELEKINESIS, FOUND FOOTAGE, AND THE B THAT WANTED TWENTY MORE MINUTES",
    headline: "CHRONICLE: A CAMERA BECOMES A SAFETY NET, THEN A WEAPON",
    deck: "A source-grounded found-footage dossier: three kids, one underground object, an abused teenager's camera, an X-Men/Cloverfield argument, impossible telekinesis shots, a fair B, and a post-credit twist tease.",
    overview: "Mike and J review Chronicle as a found-footage movie that gives the format a new direction. Three high-school kids find an unexplained object underground and gain telekinesis. The hosts focus on Andrew, whose father beats him, classmates bully him, and mother is dying. His camera becomes a safety net, a record of a life he cannot control. The power does not create his anger; it gives that anger a way out. The room compares the film to X-Men, Cloverfield, The Goonies, Blair Witch, and Paranormal Activity, then argues that Chronicle is doing something different with the form. Instead of using found footage for ghosts or a monster, it uses the camera to document young people learning what superpowers feel like. Mike keeps asking whether telekinesis is a word, but the serious point is that the premise still feels new even inside a format Hollywood has already pushed hard. The action convinces them. When the telekinesis gets large, the camera floats, pivots, and finds angles that should not be possible. The hosts credit the director, effects, cinematography, and Kodak HD image for making the powers readable rather than a blur of fake chaos. Their one real reservation is length and development. Some sections feel too long; others needed another twenty minutes. Mike gives the film a B because he wanted more from the ending and more time with the characters. J agrees the B is fair and solid, not a rejection. They both leave satisfied and strongly recommend the theater, where the camera work and power sequences can feel like a discovery. The post-review tag keeps the bit alive. The hosts repeat that this is footage that was found, use telekinesis as a subscribe cue, and tease a plot twist that changes what 'found' might mean. The page should preserve the main review and the tag separately. Chronicle's lasting WWAM identity is not just the powers; it is the tension between a camera meant to protect a damaged kid and the power that lets him stop being powerless.",
    topics: Object.freeze(["Chronicle", "telekinesis", "found footage", "Andrew", "Cloverfield", "X-Men", "The Goonies", "Kodak HD", "superhero origin", "WWAM FAM"]),
    highlights: Object.freeze(highlights),
    story: Object.freeze(story),
    fanRead: Object.freeze({
      loved: Object.freeze({ at: 120, end: 180, label: "THE CAMERA FLIES", topic: "Telekinesis", body: "Play from 2:00. The hosts explain why the impossible camera work makes the powers feel discovered instead of pasted on.", playAt: 120, playEnd: 180 }),
      hated: Object.freeze({ at: 180, end: 230, label: "B FOR MORE", topic: "Ending", body: "Play from 3:00. The movie satisfies the room but stops before the characters and ending get the extra twenty minutes they wanted.", playAt: 180, playEnd: 230 }),
      wildestDetour: Object.freeze({ at: 60, end: 120, label: "TELEKINESIS IS A WORD", topic: "Found footage", body: "Play from 1:00. X-Men, Cloverfield, Goonies, and a vocabulary fight become the format thesis.", playAt: 60, playEnd: 120 }),
      lastWord: Object.freeze({ at: 230, end: 284, label: "FOUND FOOTAGE TWIST", topic: "Outro", body: "Play the close for the theater recommendation, subscribe cue, and the twist that changes what 'found' means.", playAt: 230, playEnd: 284 })
    }),
    fam: Object.freeze({
      callouts: Object.freeze([
        F(14, 55, "THE FAM", "SHITTY-LIFE CAMERA", "Andrew records the life he cannot control."),
        F(25, 60, "THE FAM", "UNDERGROUND OBJECT", "The unexplained source gives three kids telekinesis."),
        F(45, 85, "THE FAM", "ANGRY POWER", "The ability gives a bullied kid reach."),
        F(60, 115, "THE FAM", "TELEKINESIS IS A WORD", "The vocabulary argument becomes the format argument."),
        F(70, 120, "THE FAM", "X-MEN / CLOVERFIELD / GOONIES", "The room maps the new found-footage lane."),
        F(120, 170, "THE FAM", "CAMERA FLIES", "The action shots make the power readable."),
        F(140, 180, "THE FAM", "KODAK HD", "The image quality gets a rare compliment."),
        F(170, 220, "THE FAM", "TWENTY MORE MINUTES", "The ending needed more room to land."),
        F(180, 230, "THE FAM", "B GRADE", "A solid score with a clear caveat."),
        F(225, 255, "THE FAM", "THEATER MOVIE", "The recommendation is to see the powers big."),
        F(235, 270, "THE FAM", "TELEKINESIS SUBSCRIBE", "Use your new power to click the button."),
        F(250, 284, "THE FAM", "FOUND FOOTAGE", "The tag repeats the genre name until it breaks."),
        F(265, 284, "THE FAM", "PLOT TWIST", "A final tease changes the meaning of 'found.'"),
        F(275, 284, "THE FAM", "SEQUEL ENERGY", "The room predicts more footage may exist."),
        F(280, 284, "THE FAM", "CAMERA AS WEAPON", "The safety net becomes the last word.")
      ]),
      note: "Fifteen source-local audience receipts are retained. No supporter identity or donation claim is present; the community lane is the theater recommendation and the playful twist tease."
    })
  });
  root.WWAM_EPISODE_EDITORIAL_PACKS = Object.freeze({ schema: registry.schema || "shokker-episode-editorial-packs/v1", generated: "2026-08-09", sources: Object.freeze(sources) });
})(typeof window !== "undefined" ? window : globalThis);
