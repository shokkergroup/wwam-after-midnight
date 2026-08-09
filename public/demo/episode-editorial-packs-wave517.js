(function (root) {
  "use strict";
  var registry = root.WWAM_EPISODE_EDITORIAL_PACKS || { schema: "shokker-episode-editorial-packs/v1", sources: {} };
  var sources = Object.assign({}, registry.sources || {});
  var sourceId = "jiq50ZorqcU";
  var duration = 432;
  var H = function (at, end, category, label, excerpt) {
    return { at: Math.max(0, Math.round(at)), end: Math.min(duration, Math.max(Math.round(at) + 1, Math.round(end))), category: category, label: label, excerpt: excerpt, sourceId: sourceId, kind: "human-editorial-highlight", evidenceBasis: "full-tape-human-editorial-read", evidenceState: "source-local caption/audio aligned; playback remains the authority" };
  };
  var F = function (at, end, displayName, interactionType, excerpt) {
    return { at: at, end: end, displayName: displayName, interactionType: interactionType, excerpt: excerpt, evidenceState: "source-local caption community receipt" };
  };
  var highlights = [
    H(0, 90, "SAFE HOUSE SETUP", "RYAN REYNOLDS IS A PENCIL PUSHER; DENZEL ARRIVES WITH A LAST-MINUTE RESERVATION AND THE HOUSE CATCHES FIRE", "The review begins with the housing-market joke, Tobin Frost's black-ops history, and Matt Weston's desire to become a field agent. The CIA safe house becomes a pressure cooker as soon as Denzel checks in."),
    H(90, 180, "GRAINY ACTION", "THE HITS SPIN EVERYWHERE, THE CAMERA LOOKS LIKE A FLIP PHONE, AND ONE FIGHT ACTUALLY WORKS", "The hosts like the action but hate the overused dusty, grainy image and hyperactive cutting. The Jason Bourne comparison is about imitation, not innovation."),
    H(180, 250, "THE ACTING CARRIES IT", "DENZEL IS PERFECTLY CAST, RYAN REYNOLDS DOES THE HEAVY LIFTING, AND THE PLOT HAS BEEN DONE A HUNDRED TIMES", "The room splits on who carries the film, but agrees the performances are the reason the familiar CIA story survives. Denzel's role does not give him enough dialogue; Reynolds supplies the emotional movement."),
    H(250, 320, "B-MINUS ARGUMENT", "A DECENT RENTAL WITH AN UNORIGINAL STORY, OVERGRAINED LOOK, GOOD ACTION, AND FANTASTIC ACTING", "J and Mike argue over Reynolds, then converge on a B-minus. The recommendation is a theater check if nothing else is playing, otherwise rent it rather than buy the Blu-ray."),
    H(320, 365, "WWAM FAM SHOUT-OUT", "JW UNIVERSE GETS A PUBLIC THANK-YOU FOR COMMENTING, REVIEWING, AND STAYING IN THE ROOM", "The episode pauses the score to recognize a regular commenter and fellow reviewer. That community memory belongs in the page: the channel is talking back to the audience, not just ending a review."),
    H(365, 432, "GAMING NERDS / DENTZEL POLL", "A NEW GAME CHANNEL, A Denzel-vs.-Ryan QUESTION, AND A REQUEST FOR THE FAM'S FAVORITE WASHINGTON MOVIE", "The tail turns into a network handoff and a fan prompt. Viewers are asked who they preferred, whether the review was on topic, and which Denzel movie belongs in the Hall of Fame."),
  ];
  highlights.sort(function (a, b) { return a.at - b.at; });
  var story = [
    { at: 0, end: 90, label: "THE SAFE HOUSE IS A PRESSURE COOKER WITH A BAD PUN", body: "Mike and J open by pretending Safe House is about the housing-market crisis, then explain the actual setup: Denzel Washington's Tobin Frost is a brilliant former CIA operative who went rogue, and Ryan Reynolds' Matt Weston is a naive desk-bound agent desperate for field work. Weston runs a CIA safe house for high-value prisoners; Frost arrives with a last-minute reservation and the movie catches fire around them.", evidenceBasis: "full-audio-human-editorial-read", narrative: { kind: "full-tape-human-editorial-story" } },
    { at: 90, end: 180, label: "THE ACTION IS GOOD; THE CAMERA IS EXHAUSTING", body: "The hosts like several action scenes and the eventual fight, but the visual treatment wears them down. The dusty tint looks like there is dirt on the camera, and the editing moves so fast that it can be hard to tell who is hitting whom. The Jason Bourne comparison becomes a criticism of copycat grammar: the film borrows the shake and blur without having the same sense of discovery.", evidenceBasis: "full-audio-human-editorial-read", narrative: { kind: "full-tape-human-editorial-story" } },
    { at: 180, end: 250, label: "THE PERFORMERS SAVE A STORY WE HAVE SEEN BEFORE", body: "The hosts agree the espionage plot is familiar and the twists can be seen coming. Denzel is excellent, but Mike thinks the role does not give him enough dialogue to show his full range. J thinks Ryan Reynolds carries the movie through the action and emotional beats; Mike is less enthusiastic about that claim but still credits Reynolds with making the formula watchable. Their disagreement is useful because it separates script familiarity from performance value.", evidenceBasis: "full-audio-human-editorial-read", narrative: { kind: "full-tape-human-editorial-story" } },
    { at: 250, end: 320, label: "B-MINUS IS A RENTAL GRADE, NOT AN INSULT", body: "The room lands on B-minus. The film is worth a theater check if the viewer wants a clean action night and nothing more interesting is playing, but the hosts would not recommend buying the Blu-ray. The grade accounts for the unoriginal story, overused grain, solid action, and fantastic acting without pretending the package is new.", evidenceBasis: "full-audio-human-editorial-read", narrative: { kind: "full-tape-human-editorial-story" } },
    { at: 320, end: 365, label: "THE REVIEW REMEMBERS THE PEOPLE WATCHING IT", body: "The episode pauses to thank JW Universe, a commenter and fellow reviewer whose participation has become part of the channel's small community. That shout-out is not filler. It is evidence that the show is maintaining a relationship with viewers, naming the people who keep the room alive and pointing fans toward another voice.", evidenceBasis: "full-audio-human-editorial-read", narrative: { kind: "full-tape-human-editorial-story" } },
    { at: 365, end: 432, label: "THE TAIL TURNS INTO A NETWORK HANDOFF", body: "The closing section promotes a new gaming channel, asks whether Denzel or Ryan Reynolds won the movie, and invites viewers to name their favorite Denzel Washington performance. The review ends by widening the conversation instead of simply signing off, which is exactly the kind of community receipt the Show Wiki should preserve.", evidenceBasis: "full-audio-human-editorial-read", narrative: { kind: "full-tape-human-editorial-story" } },
  ];
  sources[sourceId] = Object.freeze({
    sourceId: sourceId,
    reviewState: "full-tape-human-editorial-read",
    editorialPass: "2026-08-09 fine-toothed read of the full 7m12s Safe House review; local audio and caption evidence was checked across the housing-market opener, Tobin Frost, Matt Weston, CIA safe house setup, grainy cinematography, flip-phone camera joke, Jason Bourne comparison, action scenes, Denzel Washington, Ryan Reynolds, unoriginal spy story, B-minus grade, JW Universe community shout-out, Gaming Nerds promotion, Denzel-versus-Reynolds question, and favorite-Denzel prompt",
    evidence: Object.freeze({ duration: 432, captionWords: 1569, captionEvents: 450, captionSpanSeconds: 433.68, captionDurationCoveragePercent: 100.39, captionSha256: "21E25FA2FB576571B19D2B09B214A65E907A17EB8F69900CDC9965B6E44E68F7", captionSourceKind: "source-local canonical YouTube automatic-caption ledger acquired as edge json3", audioPass: "canonical local source audio + source-local caption alignment; playback remains the authority", audioSha256: "A70661BF69C84A4DF42602549D5F50D60C1CD72665C4E6418C6C68D5CC522458", asrSegmentCount: 0, asrSha256: null, asrCoverageStartSeconds: null, asrCoverageEndSeconds: null, speakerAttribution: false, visualOutcomeInferred: false }),
    label: "REVIEW FILE // SAFE HOUSE",
    badge: "FULL SHOW WIKI // DENZEL, RYAN REYNOLDS, GRAINY ACTION, AND THE B-MINUS SAFE HOUSE",
    headline: "SAFE HOUSE: A FAMILIAR SPY STORY WITH TWO ACTORS DOING THE OVERTIME",
    deck: "A source-grounded action dossier: a black-ops reservation, a desk agent chasing field work, flip-phone cinematography, a Jason Bourne imitation, Denzel and Reynolds carrying the formula, a B-minus grade, and a JW Universe community handoff.",
    overview: "Mike and J review Safe House as a familiar CIA story made watchable by two performers. The opening joke pretends the movie is about the housing-market crisis before introducing Tobin Frost, a brilliant former black-ops agent who went rogue, and Matt Weston, a naive desk-bound operative desperate for field work. Weston runs a CIA safe house for high-value prisoners and spies. Frost arrives with a last-minute reservation, the safe house collapses into a pressure cooker, and the chase begins. The hosts like parts of the action, especially a late fight, but dislike the visual grammar. The dusty tint looks like there is dirt on the camera, the cuts move so fast that it can be hard to tell who is hitting whom, and the Jason Bourne comparison feels like imitation rather than invention. Mike thinks Denzel Washington is perfect but underwritten; the role does not give him enough dialogue to show his full acting range. J argues that Ryan Reynolds carries the movie through the action and emotional beats. Mike is less willing to hand him the whole movie, but both agree that the performances keep an old espionage template alive. The twists are visible far in advance and nothing about the story feels entirely new. That is why the final grade is a B-minus rather than a higher score. The film is worth a theater check if the viewer wants an uncomplicated action night and nothing stronger is playing. Otherwise rent it rather than buying the Blu-ray. The episode then makes a valuable community turn. The hosts thank JW Universe, a regular commenter and fellow reviewer, and point viewers toward another channel. They promote a new gaming project, ask whether Denzel or Ryan Reynolds was the stronger screen presence, and invite the FAM to name its favorite Denzel Washington movie. This page should preserve the handoff. Safe House is not a breakthrough thriller; it is a competent rental whose grainy style has aged faster than its actors, and whose best archival value is the way the review opens the door to the people watching with them.",
    topics: Object.freeze(["Safe House", "Denzel Washington", "Ryan Reynolds", "Tobin Frost", "Matt Weston", "CIA", "Jason Bourne", "action thriller", "JW Universe", "WWAM FAM"]),
    highlights: Object.freeze(highlights),
    story: Object.freeze(story),
    fanRead: Object.freeze({
      loved: Object.freeze({ at: 180, end: 250, label: "ACTING OVERTIME", topic: "Denzel / Reynolds", body: "Play from 3:00. The room disagrees on who carries the film but agrees the performers are why the familiar story survives.", playAt: 180, playEnd: 250 }),
      hated: Object.freeze({ at: 90, end: 180, label: "FLIP-PHONE CAMERA", topic: "Cinematography", body: "Play from 1:30. Grain and frantic edits turn a Bourne imitation into a visual headache.", playAt: 90, playEnd: 180 }),
      wildestDetour: Object.freeze({ at: 320, end: 365, label: "JW UNIVERSE", topic: "Community", body: "Play from 5:20. The episode stops grading the movie to thank the commenter who keeps showing up.", playAt: 320, playEnd: 365 }),
      lastWord: Object.freeze({ at: 365, end: 432, label: "DENZEL POLL", topic: "Final prompt", body: "Play the close for the gaming-channel handoff and favorite Denzel question.", playAt: 365, playEnd: 432 })
    }),
    fam: Object.freeze({
      callouts: Object.freeze([
        F(14, 50, "THE FAM", "HOUSING MARKET SAFE HOUSE", "The opener lies about what the movie is about."),
        F(20, 85, "THE FAM", "TOBIN FROST", "Denzel arrives with a last-minute black-ops reservation."),
        F(45, 100, "THE FAM", "MATT WESTON", "Ryan Reynolds is a desk agent dreaming of field work."),
        F(90, 130, "THE FAM", "HOUSEGUEST RULE", "The CIA safe house turns into a pressure cooker."),
        F(130, 180, "THE FAM", "FLIP-PHONE CINEMATOGRAPHY", "Grain and blur become the episode's visual villain."),
        F(165, 220, "THE FAM", "JASON BOURNE COPYCAT", "The style is familiar but not freshly invented."),
        F(200, 245, "THE FAM", "DENZEL UNDERWRITTEN", "The part is perfect but the dialogue is thin."),
        F(210, 245, "THE FAM", "RYAN REYNOLDS CARRIES", "The room fights over who does the overtime."),
        F(230, 270, "THE FAM", "PLOT TWISTS A MILE AWAY", "The story telegraphs its turns."),
        F(270, 315, "THE FAM", "B-MINUS", "A rental grade for decent action and familiar parts."),
        F(300, 340, "THE FAM", "BLU-RAY RENTAL", "The hosts recommend renting before buying."),
        F(320, 365, "THE FAM", "JW UNIVERSE", "A regular commenter gets a real thank-you."),
        F(365, 405, "THE FAM", "GAMING NERDS", "The review turns into a channel handoff."),
        F(395, 432, "THE FAM", "DENZEL VS. RYAN", "The audience gets the final casting question."),
        F(410, 432, "THE FAM", "FAVORITE DENZEL MOVIE", "The closing prompt asks for a Washington Hall-of-Famer.")
      ]),
      note: "Fifteen source-local audience receipts are retained. JW Universe is named because the hosts explicitly thank that commenter on tape; no donation or supporter amount is inferred."
    })
  });
  root.WWAM_EPISODE_EDITORIAL_PACKS = Object.freeze({ schema: registry.schema || "shokker-episode-editorial-packs/v1", generated: "2026-08-09", sources: Object.freeze(sources) });
})(typeof window !== "undefined" ? window : globalThis);
