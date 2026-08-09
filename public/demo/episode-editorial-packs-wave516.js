(function (root) {
  "use strict";
  var registry = root.WWAM_EPISODE_EDITORIAL_PACKS || { schema: "shokker-episode-editorial-packs/v1", sources: {} };
  var sources = Object.assign({}, registry.sources || {});
  var sourceId = "ft4ocSmpax8";
  var duration = 475;
  var H = function (at, end, category, label, excerpt) {
    return { at: Math.max(0, Math.round(at)), end: Math.min(duration, Math.max(Math.round(at) + 1, Math.round(end))), category: category, label: label, excerpt: excerpt, sourceId: sourceId, kind: "human-editorial-highlight", evidenceBasis: "full-tape-human-editorial-read", evidenceState: "source-local caption/audio aligned; playback remains the authority" };
  };
  var F = function (at, end, displayName, interactionType, excerpt) {
    return { at: at, end: end, displayName: displayName, interactionType: interactionType, excerpt: excerpt, evidenceState: "source-local caption community receipt" };
  };
  var highlights = [
    H(0, 112, "POE POSSESSED", "EDGAR ALLAN POE REVIEWS HIS OWN MOVIE, LOSES HIS MUSTACHE, AND CALLS IT LIFETIME MOVIE NETWORK FILTH", "The cold open is a full Edgar Allan Poe performance: hope, fear, Tom Cruise confusion, a disappearing mustache, and a poem that is more committed than the film it is introducing."),
    H(112, 180, "THE MYSTERY", "A COPYCAT KILLER RECREATES POE'S STORIES AND THE DRUNK WRITER HAS TO HELP THE POLICE", "The premise is genuinely strong. The hosts explain the murder setup, Poe's suspicion, and the moment the film's serious mystery is about to become something much cheaper."),
    H(180, 270, "MURDER SHE WROTE", "TWENTY-FIVE MINUTES IN, THE RAVEN BECOMES A LIFETIME MOVIE NETWORK SPECIAL", "The hosts pinpoint the collapse: the concept has potential, then the dialogue, detective performance, and tone slide into television mystery territory."),
    H(270, 340, "SPY KIDS EDIT", "BAD EDITING, BAD SUPPORTING ACTORS, A GREAT CONCEPT, AND A STORY THAT GETS LOST IN THE HALLWAY", "The room keeps returning to the same diagnosis. John Cusack makes the movie watchable, but the edit and the supporting performances turn the mystery into Spy Kids logic."),
    H(340, 375, "5.5 VS. 6", "A MEDIOCRE FILM THAT COULD HAVE BEEN SO MUCH BETTER, WHICH IS WHY THE ROOM KEEPS YAWNING", "Mike gives 5.5 and J gives 6. They do not call it unwatchable; they call it frustrating, easy to sit through, and not worth theater money."),
    H(375, 430, "PJ SPARKLES", "MIKE'S WHITE FACE AND GLITTER SWEAT BECOME THE REAL AFTERMATH OF THE RAVEN", "The outro turns into a separate character bit: Mike's face is white, his hands look glittery, and the room asks whether makeup can save him from the camera."),
    H(430, 475, "SUBSCRIBE EXORCISM", "COOKIES, THE SANDLOT, A MILKSHAKE, AND A SUBSCRIBE BUTTON THAT MUST SAVE POE'S SOUL", "The post-review tag is a mini-sketch. J asks a life-changing cookie question, quotes The Sandlot, sings the milkshake line, and begs the viewer to click subscribe."),
  ];
  highlights.sort(function (a, b) { return a.at - b.at; });
  var story = [
    { at: 0, end: 112, label: "POE DOES THE REVIEW BEFORE MIKE AND J ARRIVE", body: "The Raven opens with J performing Edgar Allan Poe as if the poet has been forced to review the adaptation. He calls the movie a Lifetime Movie Network murder special, loses his mustache and eyebrows to disappointment, confuses Tom Cruise and Katie Holmes, and tries to make 'quote the raven, nevermore' rhyme. The performance is ridiculous, but it establishes the episode's central irony: the host's invented Poe has more life than the film's mystery.", evidenceBasis: "full-audio-human-editorial-read", narrative: { kind: "full-tape-human-editorial-story" } },
    { at: 112, end: 180, label: "THE PREMISE IS THE GOOD VERSION OF THE MOVIE", body: "The actual setup is promising. A copycat killer recreates Edgar Allan Poe's stories in real life, investigators suspect the drunk and unlucky writer, and Poe eventually has to help solve the murders. The hosts can see the thriller hiding inside that idea. Their disappointment lands because the first act gives them a reason to expect more than a routine television mystery.", evidenceBasis: "full-audio-human-editorial-read", narrative: { kind: "full-tape-human-editorial-story" } },
    { at: 180, end: 270, label: "THE MOVIE FALLS INTO MURDER SHE WROTE", body: "Around the twenty-five-minute mark, the hosts feel the shift. The dialogue gets worse, the detective goes over the top, and the film starts behaving like a Lifetime Movie Network special. John Cusack can play drunken anger and occasionally makes the room laugh, but he is forced to carry a movie whose tone has already stopped trusting its own premise.", evidenceBasis: "full-audio-human-editorial-read", narrative: { kind: "full-tape-human-editorial-story" } },
    { at: 270, end: 340, label: "THE SPY KIDS EDIT HAS LOST THE MYSTERY", body: "The hosts use Spy Kids as a deliberately cruel comparison for the second half. The edit feels careless, the supporting actors do not receive direction, and the story gets buried under transitions that seem to be moving pieces around rather than building suspense. Cusack is as good as he can be, which is exactly why the concept's failure feels like a writing and assembly problem instead of a lead-performance problem.", evidenceBasis: "full-audio-human-editorial-read", narrative: { kind: "full-tape-human-editorial-story" } },
    { at: 340, end: 375, label: "THE SCORE IS A FRUSTRATION SCORE", body: "Mike gives The Raven a 5.5 and J gives it a 6. They can sit through it and even imagine watching it again, but only because it is easy television, not because the film earns a return trip. The low recommendation is about wasted potential: the premise, Poe, and Cusack could have made something much sharper.", evidenceBasis: "full-audio-human-editorial-read", narrative: { kind: "full-tape-human-editorial-story" } },
    { at: 375, end: 430, label: "MIKE'S FACE BECOMES THE POST-CREDITS CHARACTER", body: "The regular review ends, but the tape keeps going. J points out that Mike's face is unusually white and his hands look glittery, then begins treating him like a separate PJ Sparkles character. The improvised aftermath is more playful than the film's supposed jokes, a useful reminder that the WWAM booth can create a bit from the room itself.", evidenceBasis: "full-audio-human-editorial-read", narrative: { kind: "full-tape-human-editorial-story" } },
    { at: 430, end: 475, label: "THE SUBSCRIBE BUTTON MUST SAVE A SOUL", body: "The final tag becomes a miniature call-to-action sketch. A question about cookies turns into The Sandlot, a milkshake lyric, a windshield-wiper motion, and a plea for the viewer to click subscribe. It is not part of the score, but it belongs in the page because it shows the hosts' instinct to keep playing after the review has technically ended.", evidenceBasis: "full-audio-human-editorial-read", narrative: { kind: "full-tape-human-editorial-story" } },
  ];
  sources[sourceId] = Object.freeze({
    sourceId: sourceId,
    reviewState: "full-tape-human-editorial-read",
    editorialPass: "2026-08-09 fine-toothed read of the full 7m55s The Raven review; local audio and caption evidence was checked across the Edgar Allan Poe cold open, Tom Cruise and Katie Holmes confusion, mustache disappearance, Lifetime Movie Network comparison, copycat killer premise, John Cusack praise, Murder She Wrote turn, detective performance, Spy Kids edit metaphor, pen-as-sword detour, 5.5-versus-6 split, PJ Sparkles face bit, cookies, The Sandlot, milkshake lyric, and subscribe tag",
    evidence: Object.freeze({ duration: 475, captionWords: 1387, captionEvents: 458, captionSpanSeconds: 476.88, captionDurationCoveragePercent: 100.4, captionSha256: "6385F52EBCBC0E83EFD5F26D6D87C01C7BD96284961628F96876DB62675BB7D6", captionSourceKind: "source-local canonical YouTube automatic-caption ledger acquired as edge json3", audioPass: "canonical local source audio + source-local caption alignment; playback remains the authority", audioSha256: "16E8FC88C49BA959A71BF9395B4735A3CEC87D127AC00CEAC4DD8B5AE75A5E65", asrSegmentCount: 0, asrSha256: null, asrCoverageStartSeconds: null, asrCoverageEndSeconds: null, speakerAttribution: false, visualOutcomeInferred: false }),
    label: "REVIEW FILE // THE RAVEN",
    badge: "FULL SHOW WIKI // POE POSSESSED, MURDER SHE WROTE, AND PJ SPARKLES AFTERMATH",
    headline: "THE RAVEN: A GREAT PREMISE THAT GETS LOST IN THE PEN STROKES",
    deck: "A source-grounded John Cusack dossier: Poe reviews his own film, a copycat killer starts with a real hook, the mystery collapses into Lifetime television, and the aftermath becomes a cookies-and-PJ-Sparkles sketch.",
    overview: "The Raven opens with J performing Edgar Allan Poe before Mike and J officially arrive. Poe is disappointed, loses his mustache and eyebrows, confuses Tom Cruise with the movie's cast, and calls the film a Lifetime Movie Network murder special. The bit is more than an intro gag. It establishes the episode's central irony: the invented Poe has more energy and personality than the adaptation's mystery. The premise itself is strong. A copycat killer recreates Poe's stories in real life, investigators suspect the drunk and unlucky writer, and Poe has to help solve the murders once they realize he is not responsible. The hosts can see the film that could have existed. Around twenty-five minutes in, they feel the collapse. The dialogue changes, the detective performance goes over the top, and the movie becomes Murder She Wrote in a dark coat. John Cusack is the clear positive. His drunken anger can be funny, he makes the film watchable, and the final confrontation with the killer contains the best dialogue exchange. But the supporting cast, editing, and tone do not protect the concept. The hosts compare the second half to Spy Kids: a great idea assembled with little care, transitions that move pieces without building suspense, and a story that gets lost. Their pen-as-sword detour captures the booth's ability to turn a prop into a character bit, but it also makes the contrast visible—WWAM can create play from a bad moment more easily than the film can create momentum. Mike gives The Raven a 5.5 and J gives it a 6. They do not call it unwatchable. They call it easy television, frustrating because it could have been much better, and not worth theater money. The tape continues into an afterlife of its own: Mike's unusually white face, glitter-looking hands, PJ Sparkles jokes, cookies, The Sandlot, a milkshake lyric, and a plea for the subscribe button to save a soul. The page should keep that tag. The review's real story is not simply that the movie is mediocre; it is that a promising Poe mystery gets reduced to a background television special while the hosts' improvised aftermath becomes the memorable part.",
    topics: Object.freeze(["The Raven", "Edgar Allan Poe", "John Cusack", "copycat killer", "Murder She Wrote", "Lifetime Movie Network", "Spy Kids", "PJ Sparkles", "The Sandlot", "WWAM FAM"]),
    highlights: Object.freeze(highlights),
    story: Object.freeze(story),
    fanRead: Object.freeze({
      loved: Object.freeze({ at: 112, end: 180, label: "THE PREMISE", topic: "Copycat killer", body: "Play from 1:52. A real Poe mystery is hiding inside the film before it turns into television.", playAt: 112, playEnd: 180 }),
      hated: Object.freeze({ at: 180, end: 270, label: "MURDER SHE WROTE", topic: "Tone collapse", body: "Play from 3:00. The hosts pinpoint the moment the movie stops feeling like a thriller.", playAt: 180, playEnd: 270 }),
      wildestDetour: Object.freeze({ at: 375, end: 430, label: "PJ SPARKLES", topic: "Aftermath", body: "Play from 6:15. Mike's white face and glitter sweat become a new character after the review ends.", playAt: 375, playEnd: 430 }),
      lastWord: Object.freeze({ at: 430, end: 475, label: "COOKIES / SUBSCRIBE", topic: "Post-credit tag", body: "Play the last minute for The Sandlot, the milkshake, and a subscribe button asked to save a soul.", playAt: 430, playEnd: 475 })
    }),
    fam: Object.freeze({
      callouts: Object.freeze([
        F(0, 45, "THE FAM", "POE POSSESSED", "The poet reviews the review before the hosts can begin."),
        F(12, 70, "THE FAM", "MUSTACHE DISAPPEARS", "The movie is so disappointing even Poe's face leaves."),
        F(35, 90, "THE FAM", "TOM CRUISE / KATIE HOLMES", "Poe takes a wrong turn through celebrity confusion."),
        F(112, 165, "THE FAM", "COPYCAT KILLER", "The premise has real murder-mystery potential."),
        F(165, 215, "THE FAM", "MURDER SHE WROTE", "The mystery turns into a television special."),
        F(205, 250, "THE FAM", "JOHN CUSACK", "Drunken anger keeps the movie watchable."),
        F(215, 245, "THE FAM", "DETECTIVE OVERACTS", "The room blames direction as much as performance."),
        F(245, 290, "THE FAM", "LIFETIME MOVIE NETWORK", "The background-TV fate is sealed."),
        F(270, 320, "THE FAM", "SPY KIDS EDIT", "The story gets assembled without a clean mystery engine."),
        F(270, 305, "THE FAM", "PEN SWORD", "A prop becomes a WWAM detour."),
        F(340, 375, "THE FAM", "5.5 VS. 6", "The score preserves frustration without calling it unwatchable."),
        F(375, 425, "THE FAM", "PJ SPARKLES", "Mike's face becomes the post-review character."),
        F(415, 455, "THE FAM", "DO YOU LIKE COOKIES?", "A life-changing question that is not the question."),
        F(450, 475, "THE FAM", "THE SANDLOT / MILKSHAKE", "The tag quotes two different movies and keeps going."),
        F(430, 475, "THE FAM", "SUBSCRIBE EXORCISM", "The button must save Poe's soul.")
      ]),
      note: "Fifteen source-local audience receipts are retained. No supporter identity or donation claim is present; the community lane is the conditional television recommendation and the post-review subscribe sketch."
    })
  });
  root.WWAM_EPISODE_EDITORIAL_PACKS = Object.freeze({ schema: registry.schema || "shokker-episode-editorial-packs/v1", generated: "2026-08-09", sources: Object.freeze(sources) });
})(typeof window !== "undefined" ? window : globalThis);
