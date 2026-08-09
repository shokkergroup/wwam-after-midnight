(function (root) {
  "use strict";
  var registry = root.WWAM_EPISODE_EDITORIAL_PACKS || { schema: "shokker-episode-editorial-packs/v1", sources: {} };
  var sources = Object.assign({}, registry.sources || {});
  var sourceId = "GBOlv58BBXg";
  var duration = 9499;
  var H = function (at, end, category, label, excerpt) {
    return { at: Math.max(0, Math.round(at)), end: Math.min(duration, Math.max(Math.round(at) + 1, Math.round(end))), category: category, label: label, excerpt: excerpt, sourceId: sourceId, kind: "human-editorial-highlight", evidenceBasis: "full-tape-human-editorial-read", evidenceState: "source-local audio + local ASR aligned; playback remains the authority" };
  };
  var highlights = [
    H(90, 360, "OPENING CHAOS", "WELCOME TO THE ROOM WHERE SCREAM NEWS AND A HOT STUDIO TURN INTO THE SAME STORY", "The tape opens like a normal WWAM live show and immediately refuses to separate news from nonsense. The audience is in the room before the episode has chosen which horror franchise gets yelled about first."),
    H(450, 720, "SAW / FAM", "THE CHAT WANTS MUSICAL OPINIONS AND THE HOSTS KNOW THAT IS A TRAP", "A viewer asks for musical opinions and the booth hesitates. It is a funny little boundary marker: WWAM will debate a killer's motive for an hour, but music is where the room suddenly wants legal counsel."),
    H(2650, 2820, "FAM RECEIPT", "A SUPER CHAT HAS A PROVOCATIVE NAME AND THE ROOM THANKS IT ANYWAY", "The hosts acknowledge the Super Chat and the name's provocative quality without turning the receipt into invented biography. It is a clean example of the FAM lane being part of the show's rhythm, not an afterthought."),
    H(3000, 3210, "WWAM UP IN YA", "THE LIFEHOUSE MEMORY HAS BEEN EATEN BY TIME AND SWEARING", "A half-remembered Lifehouse reference turns into a scramble to reconstruct what the hell the story was. The uncertainty is the bit: nobody pretends the memory is cleaner than it is."),
    H(3500, 3740, "CHARACTER CANON", "MANDO VIKING ORDERS LOOMIS, THEN SHAPE IN THE SHADOWS ORDERS SLENDERMAN", "Mando Viking asks for Dr. Loomis and Shape in the Shadows asks for a Slenderman shout-out. J acknowledges the history of the request, creating two playable character doors without claiming which host is performing each line."),
    H(3740, 3930, "FAM RECEIPT", "THE BEST-GUYS-EVER MESSAGE LANDS BETWEEN LOOMIS AND THE NEXT DERAILMENT", "A viewer calls the hosts the best, then the room rolls on. The receipt matters because it shows the emotional contract behind the vulgarity: the audience is not merely watching; it is steering the tone."),
    H(4070, 4350, "SCREAM", "SCREAM NEWS STARTS AS A THEORY DESK AND ENDS AS A FRANCHISE ARGUMENT", "The Scream lane weighs rumor, sequel expectations, and whether a new entry can surprise anyone after the series has taught the audience every trick. The hosts want the movie to be clever without turning cleverness into a substitute for tension."),
    H(5500, 5900, "HORROR FRANCHISES", "MICHAEL, JASON, FREDDY, AND CHUCKY GET PUT IN THE SAME FAMILY PHOTO", "The room compares the icons as if they are competing relatives: Michael's blankness, Jason's body count, Freddy's performance, and Chucky's comic timing. The point is not a definitive ranking; it is hearing what each character gives the booth to play with."),
    H(5780, 6060, "HALLOWEEN LORE", "THE CURSE OF MICHAEL MYERS REMEMBERS LOOMIS AS A MAN WHO COULD STILL BREAK", "The hosts return to Loomis at the end of Curse of Michael Myers—crying, screaming, yelling—and treat that emotional collapse as a key to why the character matters. The franchise discussion becomes a performance discussion without claiming a verified impression."),
    H(6200, 6420, "THE BABADOOK", "THE BUBBLE DUKE REVIEW DOOR OPENS AND EVERYONE KNOWS THE TITLE IS WRONG", "The Babadook revisit begins under the show's accidental name 'the bubble duke.' The mispronunciation becomes a playable stinger, then the room settles into the film's grief, monster metaphor, and slow-burn craft."),
    H(6370, 6680, "CHARACTER SIGNAL", "CHUCKY VERSUS JASON VERSUS MYERS BECOMES A TERRIBLE FAMILY REUNION", "A viewer asks about Chucky versus Jason Myers, and the hosts try to work out whether the title is real, a mash-up, or a chat hallucination. The confusion is useful archive material because it makes the audience's franchise memory visible."),
    H(6850, 7050, "THE BABADOOK", "THE LOOMIS QUESTION RETURNS WHILE THE BABADOOK GETS MORE UNCOMFORTABLE", "The Babadook discussion keeps circling back to horror's emotional cost. Loomis is used as a comparison point: a character can be frightening because the person underneath the role is cracking, not because the movie keeps adding louder monsters."),
    H(7180, 7410, "FAM / HALLOWEEN", "TROY GRUBB PITCHES A DIFFERENT FUTURE FOR MICHAEL MYERS", "Troy Grubb's idea about Michael Myers doing different things gives the Halloween lane a future-facing detour. The hosts test whether the Shape can evolve without losing the blank menace that made him work."),
    H(7250, 7480, "CHARACTER CANON", "FREDDY, JASON, MICHAEL, AND CHUCKY ALL GET THE 'WHAT IF THE FRANCHISE IS DONE?' QUESTION", "The crossover talk turns into a franchise-life question. Freddy, Jason, Michael, and Chucky can all be funny, scary, or exhausted depending on what the story asks them to do; the booth is most interested in the exact moment a character stops being dangerous and becomes a logo."),
    H(7800, 8070, "THE BABADOOK", "THE ENDING MAKES THE ROOM ASK WHAT THE FUCK THE MONSTER IS LISTENING TO", "The Babadook's ending is treated as the problem worth revisiting: the film's emotional metaphor gets sharper, stranger, and harder to explain right when the monster starts obeying. The hosts argue whether that is the point or the fart in the soup."),
    H(8900, 9130, "THE ROOM BREAKS", "THE SUBSTITUTE-TEACHER LIGHTS-OFF STORY EXPLAINS THE BEST KIND OF HORROR CROWD", "A story about a substitute teacher and someone turning off the lights becomes a perfect explanation of audience behavior: the scare is not only the thing in the dark, but the person in the room who knows exactly when to make it happen."),
    H(9280, 9499, "LAST CALL", "THE RIDDLER AND TWO-FACE COSTUMES GET A QUICK LOOK BEFORE THE FAM GOODBYE", "Batman news closes the show with a glimpse of the Riddler and Two-Face costumes, followed by a careful thank-you to Rhi Kanazawa. The horror room exits through superhero imagery and a genuinely human sign-off."),
  ];
  highlights.sort(function (a, b) { return a.at - b.at; });
  var story = [
    { at: 90, end: 3500, label: "THE CHAT BUILDS THE ROOM BEFORE SCREAM ARRIVES", body: "Musical opinions, a provocative Super Chat, a mangled Lifehouse memory, and the channel's willingness to admit uncertainty set the texture. When the hosts finally reach Scream news, the audience already understands this is a conversation that will be steered from the chat as much as from the headline.", evidenceBasis: "full-audio-human-editorial-read", narrative: { kind: "full-audio-human-editorial-story" } },
    { at: 3500, end: 5900, label: "LOOMIS, SLENDERMAN, SCREAM, AND THE FOUR-FAMILY HORROR PHOTO", body: "Mando Viking asks for Loomis, Shape in the Shadows asks for Slenderman, and Scream gets its theory-desk treatment. Then Michael, Jason, Freddy, and Chucky are put in one family photo so the hosts can compare blank menace, body count, performance, and comic timing.", evidenceBasis: "full-audio-human-editorial-read", narrative: { kind: "full-audio-human-editorial-story" } },
    { at: 5900, end: 7800, label: "THE BABADOOK REVISIT STARTS AS THE BUBBLE DUKE", body: "The Babadook arrives under an accidental nickname and becomes the evening's serious film conversation. Grief, metaphor, the monster's obedience, and the emotional collapse of Loomis in Curse of Michael Myers all become ways to ask whether horror works best when the human being is the thing falling apart.", evidenceBasis: "full-audio-human-editorial-read", narrative: { kind: "full-audio-human-editorial-story" } },
    { at: 7800, end: 9130, label: "THE ENDING ARGUMENT AND THE SUBSTITUTE-TEACHER THEORY OF FEAR", body: "The Babadook ending makes the room uncomfortable because the monster starts listening. The hosts argue over whether the film's metaphor resolves or simply gets domesticated, then a substitute-teacher story supplies a compact theory of audience fear: someone always knows when to turn off the lights.", evidenceBasis: "full-audio-human-editorial-read", narrative: { kind: "full-audio-human-editorial-story" } },
    { at: 9130, end: 9499, label: "BATMAN COSTUMES AND A CAREFUL GOODNIGHT", body: "A quick Riddler/Two-Face costume look lets the show leave horror through superhero news. Rhi Kanazawa gets a careful thank-you, and the archive closes on the audience relationship that made the whole night feel steerable in the first place.", evidenceBasis: "full-audio-human-editorial-read", narrative: { kind: "full-audio-human-editorial-story" } },
  ];
  sources[sourceId] = Object.freeze({
    sourceId: sourceId,
    reviewState: "full-tape-human-editorial-read",
    editorialPass: "2026-08-09 fine-toothed full-audio read of the 2h38m19s Scream News and Theories + The Babadook Revisited livestream; local audio, canonical captions, and Whisper ledger checked across the opening chat, Lifehouse memory, provocative Super Chat, Mando Viking Loomis request, Shape in the Shadows Slenderman request, Scream theory desk, Michael/Jason/Freddy/Chucky comparison, Curse of Michael Myers Loomis collapse, Bubble Duke/Babadook revisit, Chucky-versus-Jason question, Troy Grubb Michael idea, Babadook ending argument, substitute-teacher lights-out story, Riddler/Two-Face costume close, and Rhi Kanazawa thank-you",
    evidence: Object.freeze({
      duration: 9499,
      captionWords: 34552,
      captionEvents: 5361,
      captionSpanSeconds: 9500.96,
      captionDurationCoveragePercent: 100,
      captionSha256: "C2018F90A82B79BF1803FF03BB46BFE32ED7B6E8FF819CA53C291B6C54111CD2",
      captionSourceKind: "source-local canonical YouTube automatic-caption ledger + local Whisper ledger",
      audioPass: "canonical local source audio + local Whisper alignment; playback remains the authority",
      audioSha256: "996D036A5F481F88E6B3735C0AE0183EC2D6EF C46C9CFD4D63C99509DE210D37".replace(/\s+/g, ""),
      asrSegmentCount: 408,
      asrSha256: "sha256:413F133510FC1B20F580F0C5E270F98481110E92DF8CD9D0CC43B940D910CA6F",
      asrCoverageStartSeconds: 94,
      asrCoverageEndSeconds: 9440.98,
      speakerAttribution: false,
      visualOutcomeInferred: false
    }),
    label: "SCREAM NEWS + THE BABADOOK REVISITED",
    badge: "FULL SHOW WIKI // LOOMIS, SLENDERMAN, THE BUBBLE DUKE, AND HORROR FAMILY DRAMA",
    headline: "THE BUBBLE DUKE OPENS, LOOMIS BREAKS DOWN, AND THE BABADOOK REFUSES TO BE HOUSE-TRAINED",
    deck: "A full-audio horror room that moves from Scream theories to Loomis and Slenderman requests, then revisits The Babadook's grief, monster logic, and uncomfortable ending before Batman costumes close the door.",
    overview: "The April 15 show is a Scream-news desk wrapped around a character-and-metaphor argument. A musical-opinion trap, a provocative Super Chat, and a mangled Lifehouse memory establish the chat's control of the room. Mando Viking asks for Dr. Loomis; Shape in the Shadows asks for Slenderman; and Scream gets the theory treatment without the hosts pretending a rumor is a fact. Michael Myers, Jason, Freddy, and Chucky become one terrible family photo, while the end of Curse of Michael Myers gives Loomis a human collapse worth preserving. Then The Babadook arrives as the Bubble Duke, and the misnamed review turns serious: grief, the monster's obedience, and whether the ending resolves the metaphor or merely domesticates it. Troy Grubb pitches a different future for Michael, a substitute-teacher lights-out story explains how crowds manufacture fear, and Batman's Riddler/Two-Face costumes lead into a careful thank-you to Rhi Kanazawa. Local audio and aligned ASR support every route; playback remains the authority.",
    topics: Object.freeze(["Scream", "The Babadook", "Dr. Loomis", "Slenderman", "Michael Myers", "Jason", "Freddy Krueger", "Chucky", "Curse of Michael Myers", "Batman", "Riddler", "Two-Face", "FAM culture"]),
    highlights: Object.freeze(highlights),
    story: Object.freeze(story),
    fanRead: Object.freeze({
      loved: Object.freeze({ at: 3500, end: 3740, label: "LOOMIS AND SLENDERMAN TAKE REQUESTS", topic: "Character canon", body: "Play the Mando Viking and Shape in the Shadows requests for the quickest route into the show's playable character memory.", playAt: 3500, playEnd: 3740 }),
      hated: Object.freeze({ at: 7800, end: 8070, label: "THE BABADOOK ENDING ARGUMENT", topic: "The Babadook", body: "Play the ending discussion for the episode's most divided film take: the metaphor gets sharper exactly where the room gets less comfortable.", playAt: 7800, playEnd: 8070 }),
      wildestDetour: Object.freeze({ at: 3300, end: 3440, label: "THE MUTED BUTT-SEX QUESTION", topic: "WWAM Up in Ya", body: "Play the chat derailment for a live-room interruption that is too specific and too badly timed to be scripted.", playAt: 3300, playEnd: 3440 }),
      lastWord: Object.freeze({ at: 9280, end: 9499, label: "RIDDLER, TWO-FACE, AND RHI KANAZAWA", topic: "Batman / FAM", body: "Play the close for the cleanest handoff from franchise talk back to the people steering the room.", playAt: 9280, playEnd: 9499 })
    }),
    fam: Object.freeze({
      callouts: Object.freeze([
        { at: 3500, end: 3575, name: "Mando Viking", kind: "chat receipt", note: "Asks Jay for a Dr. Loomis moment." },
        { at: 3550, end: 3620, name: "Shape in the Shadows", kind: "chat receipt", note: "Asks for a Slenderman shout-out." },
        { at: 7160, end: 7410, name: "Troy Grubb", kind: "chat receipt", note: "Pitches a different future for Michael Myers." },
        { at: 9280, end: 9499, name: "Rhi Kanazawa", kind: "Super Chat", note: "Receives a careful thank-you during the Batman-costume close." }
      ]),
      note: "Named FAM receipts are kept only where the local caption/audio ledger makes the name and interaction audible. No donation amount, identity, or off-tape outcome is inferred."
    })
  });
  root.WWAM_EPISODE_EDITORIAL_PACKS = Object.freeze({ schema: registry.schema || "shokker-episode-editorial-packs/v1", generated: "2026-08-09", sources: Object.freeze(sources) });
})(typeof window !== "undefined" ? window : globalThis);
