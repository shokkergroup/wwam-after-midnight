(function (root) {
  "use strict";
  var registry = root.WWAM_EPISODE_EDITORIAL_PACKS || { schema: "shokker-episode-editorial-packs/v1", sources: {} };
  var sources = Object.assign({}, registry.sources || {});
  var sourceId = "NQtFSzceYjA";
  var duration = 10815;
  var H = function (at, end, category, label, excerpt) {
    return { at: Math.max(0, Math.round(at)), end: Math.min(duration, Math.max(Math.round(at) + 1, Math.round(end))), category: category, label: label, excerpt: excerpt, sourceId: sourceId, kind: "human-editorial-highlight", evidenceBasis: "full-tape-human-editorial-read", evidenceState: "source-local audio + local ASR aligned; playback remains the authority" };
  };
  var highlights = [
    H(34, 620, "SNYDER CUT", "THE SPOILER PARTY OPENS WITH SUPERMAN, DARKSEID, AND A WEDNESDAY-NIGHT NERVOUS BREAKDOWN", "The stream opens on the restored Justice League and immediately asks what the movie means for the future: Darkseid, Superman's return, Cyborg's recovery, and the fear that the thing might actually be bad."),
    H(620, 1120, "SNYDER CUT", "CYBORG GETS HIS MOVIE BACK AND THE WEDON CUT GETS PUT ON TRIAL", "The hosts compare Cyborg's emotional arc, the rooftop scene, and the Russian-family material, arguing that the restored cut feels like a movie while the other version feels like a committee with a camera."),
    H(1120, 1640, "SNYDER CUT", "WARNER BROS., JOSS WHEDON, AND THE 'YOU HAD THE MONEY' ARGUMENT", "The discussion separates the studio's choices from the hosts' anger at Whedon, then asks what happens when a director leaves and the replacement is given permission to change the movie instead of finish it."),
    H(1640, 2220, "SNYDERVERSE FUTURES", "FLASHPOINT, THE NIGHTMARE WORLD, AND A ROAD TO JUSTICE LEAGUE TWO", "The proposed future begins with Flashpoint: Barry saves his mother, breaks the timeline, and opens a door into the nightmare sequence. The hosts imagine Justice League Two and Three as consequences, not random sequel bait."),
    H(2220, 2850, "FAM / SNYDERVERSE", "RESTORE THE SNYDERVERSE BECOMES A BUSINESS PLAN", "The booth moves from fan slogan to hypothetical pitch: let Snyder finish his arc, keep Aquaman and Wonder Woman where they work, and use the restored Justice League as the canon starting line without pretending the corporate path is simple."),
    H(3000, 3260, "WWAM UP IN YA", "THE PRE-STREAM POOP SCHEDULE AND THE SUPER CHAT THAT CATCHES IT", "A bathroom break becomes a production ritual: both hosts poop before streams, their timing synchronizes, and the FAM learns more about the booth's digestive workflow than any Justice League press kit would dare disclose."),
    H(3260, 3700, "JOKER CANON", "JARED LETO'S JOKER GETS A SECOND CHANCE IN THE NIGHTMARE SEQUENCE", "The hosts argue that Zack Snyder understood the Joker's pressure points and gave Jared Leto lines that let the character exist as Batman's personal nemesis instead of a noisy Suicide Squad leftover."),
    H(3700, 4360, "JOKER CANON", "ROBIN, HARLEY, BATMAN, AND THE JOKER WHO IS OBSESSED WITH THE WRONG PERSON", "The nightmare conversation digs into Robin's death, Harley Quinn's fate, and why this Joker's fixation is Batman. The booth treats the scene as a future story engine, not a finished explanation."),
    H(4360, 4920, "SNYDER CUT", "THE FOUR-HOUR MOVIE DEFENSE, JOHN CAMPY, AND THE WHITE-ASS-BALL ARGUMENT", "The hosts defend the film's length and complain about critics who wanted a shorter, safer cut. John Campy's skepticism becomes a named target in a debate about whether fans were right to keep asking."),
    H(4920, 5600, "SUPERMAN", "MARTHA, THE DARK SUIT, AND WHY SUPERMAN FINALLY LOOKS LIKE THE PLAN", "The booth compares Superman's return in the two cuts, debates the suit and the Martha choice, and argues that the restored version lets the character feel like the endpoint of a plan instead of a late patch."),
    H(5600, 6500, "WONDER WOMAN / AQUAMAN", "THE WONDER WOMAN STEPPENWOLF FIGHT AND THE AQUAMAN SCENE THAT SETS THE TONE", "The restored Wonder Woman opening is treated as a threat assessment rather than a joke, while Aquaman's arrival gives the hosts the exact moment they realized the tone had changed."),
    H(6500, 7200, "FAM RECEIPT", "MIKE WHITE JR., DIRK JASON ALL, AND THE WEDON CAREER MEMORIAL", "The FAM asks for a Whedon career eulogy, remembers the parts that were cut, and makes the hosts explain why one version can be funny in places while still feeling wrong as a whole."),
    H(7200, 8050, "SNYDER CUT", "THE FAMILY RESCUE, THE WONDER WOMAN HEADS, AND THE CAMERA THAT DIED", "A Superman rescue and Wonder Woman's violence get compared across cuts, then the camera decides it has had enough and forces the hosts to troubleshoot while still arguing about canon."),
    H(8050, 8700, "SNYDER CUT", "STEPPENWOLF, TOASTED CHALUPA, AND THE SCENE THAT MAKES THE VILLAIN FEEL LIKE A VILLAIN", "Steppenwolf's design, his exchanges with Diana, and the missing sense of threat become the focus. The chat adds Taco Bell and poop jokes because no WWAM villain gets a clean academic paragraph."),
    H(8700, 9380, "SNYDER CUT", "SUPERMAN WALKS IN, CYBORG FEELS IT, AND THE DARKSEID STARE-DOWN LANDS", "The restored return gives Superman weight, lets Cyborg's grief register, and ends in the Darkseid/Superman/Justice League stare-down the hosts wanted from the first film."),
    H(9380, 10180, "SNYDERVERSE FUTURES", "JUSTICE LEAGUE TWO, THREE, THE BATMAN HBO MAX SERIES, AND DEATH IN THE FAMILY", "The proposed roadmap uses Flashpoint to open the nightmare world, Justice League Two to explain it, Justice League Three to play it out, and a Batman series to tell the Joker-kills-Robin story without repeating an origin."),
    H(10180, 10815, "LAST CALL", "DARKSEID FIRST, CYBORG'S SOUNDTRACK, AND RESTORE THE SNYDERVERSE UNTIL THE LIGHTS GO OUT", "The close argues Darkseid predates the Marvel comparison, praises the soundtrack and Cyborg, and leaves the FAM with one final demand: restore the story while the audience is still here to watch it."),
  ];
  highlights.sort(function (a, b) { return a.at - b.at; });
  var story = [
    { at: 34, end: 1640, label: "THE RESTORED CUT GIVES CYBORG A HEART AND THE STUDIO A BILL", body: "The spoiler stream opens by comparing Snyder's Justice League with the Whedon version: Cyborg's arc, the rooftop scene, the Russian family, Superman's return, and a villain who is allowed to feel like a threat. The hosts are angry at the studio choices but keep returning to the same question: who was allowed to finish the movie, and who was allowed to rewrite it?", evidenceBasis: "full-audio-human-editorial-read", narrative: { kind: "full-audio-human-editorial-story" } },
    { at: 1640, end: 3260, label: "FLASHPOINT TURNS RESTORE THE SNYDERVERSE INTO A ROADMAP", body: "Flashpoint, the nightmare world, Justice League Two and Three, an Injustice-style branch, and a future where Aquaman and Wonder Woman remain canon all emerge from the live debate. The slogan becomes a hypothetical business plan, then the hosts pause for the pre-stream poop ritual and a FAM receipt that makes the bathroom schedule part of the archive.", evidenceBasis: "full-audio-human-editorial-read", narrative: { kind: "full-audio-human-editorial-story" } },
    { at: 3260, end: 5600, label: "JOKER, ROBIN, HARLEY, AND A FOUR-HOUR MOVIE THAT REFUSES TO APOLOGIZE", body: "Jared Leto's Joker gets a second chance in the nightmare sequence. The booth reads the Batman/Joker relationship, Robin's death, Harley Quinn's fate, and the scene as a future engine. Then the four-hour runtime and John Campy criticism turn the stream into a defense of letting a filmmaker finish the version he actually made.", evidenceBasis: "full-audio-human-editorial-read", narrative: { kind: "full-audio-human-editorial-story" } },
    { at: 5600, end: 9380, label: "SUPERMAN, WONDER WOMAN, AQUAMAN, AND STEPPENWOLF FINALLY SHARE A TONAL UNIVERSE", body: "The restored Superman return, Martha and the suit, Wonder Woman's threat assessment, Aquaman's arrival, the family rescue, Steppenwolf's design, and a camera failure all become evidence for the same claim: the restored film gives its heroes and villains a common tone. The FAM keeps puncturing the seriousness with Taco Bell and poop jokes, as tradition demands.", evidenceBasis: "full-audio-human-editorial-read", narrative: { kind: "full-audio-human-editorial-story" } },
    { at: 9380, end: 10815, label: "THE FUTURE IS A NIGHTMARE, A BATMAN SERIES, AND ONE LAST RESTORE THE SNYDERVERSE", body: "The proposed future is unusually specific: Flashpoint opens the timeline wound, Justice League Two explains the nightmare, Justice League Three plays it out, and a Batman series handles Death in the Family and Joker without another origin story. The tape closes on Darkseid, Cyborg's soundtrack, and a fan movement that still wants the story to continue.", evidenceBasis: "full-audio-human-editorial-read", narrative: { kind: "full-audio-human-editorial-story" } },
  ];
  sources[sourceId] = Object.freeze({
    sourceId: sourceId,
    reviewState: "full-tape-human-editorial-read",
    editorialPass: "2026-08-09 fine-toothed full-audio read of the 3h00m15s Zack Snyder's Justice League Spoilers + Futures LIVE stream; local audio, canonical captions, and Whisper ledger checked across Cyborg and the rooftop scene, Whedon/studio responsibility, Restore the Snyderverse planning, Flashpoint and the nightmare future, the pre-stream poop ritual, Jared Leto's Joker, Robin/Harley/Batman futures, four-hour runtime defense, Superman/Martha/suit, Wonder Woman and Aquaman tone, Steppenwolf, FAM receipts, camera failure, Darkseid/Superman stare-down, Justice League Two/Three, Batman HBO Max and Death in the Family, soundtrack/Cyborg praise, and final restore demand",
    evidence: Object.freeze({
      duration: 10815,
      captionWords: 40248,
      captionEvents: 6067,
      captionSpanSeconds: 10816.8,
      captionDurationCoveragePercent: 100,
      captionSha256: "2BB97440F3421D3945ABDD96F2F8DF09EF00276CBF28EAC233212A16A8129AFD",
      captionSourceKind: "source-local canonical YouTube automatic-caption ledger + local Whisper ledger",
      audioPass: "canonical local source audio + local Whisper alignment; playback remains the authority",
      audioSha256: "69EE931CFE9D562DBFD5326AEF2C65E329F2E98B73CF2C422C0ADB0F3EE5FCE8",
      asrSegmentCount: 592,
      asrSha256: "sha256:51B21220316E0BE4E8CD851BE9E0272FF97B59234FE8999C10B94CFFA38378B4",
      asrCoverageStartSeconds: 34,
      asrCoverageEndSeconds: 10814.58,
      speakerAttribution: false,
      visualOutcomeInferred: false
    }),
    label: "ZACK SNYDER'S JUSTICE LEAGUE // SPOILERS + FUTURES LIVE",
    badge: "FULL SHOW WIKI // CYBORG, JOKER, NIGHTMARE FUTURES, AND FAM RECEIPTS",
    headline: "CYBORG GETS HIS HEART BACK, THE JOKER GETS A FUTURE, AND THE SNYDERVERSE GETS A MAP",
    deck: "A full-audio WWAM read of the three-hour spoiler night: Cyborg's restored arc, the Whedon/studio argument, Jared Leto's Joker, Flashpoint, a nightmare-world roadmap, Superman's return, Steppenwolf, and the FAM's live receipts.",
    overview: "This is the Snyder Cut stream as an argument with a future attached. The hosts compare Cyborg's restored emotional arc, the rooftop scene, the Russian family, Superman's return, and Steppenwolf's threat against the Whedon version, while trying to separate studio decisions from their anger at the replacement director. Then Restore the Snyderverse becomes an actual roadmap: Flashpoint breaks the timeline, the nightmare sequence becomes a setting, Justice League Two and Three carry the consequences, and a Batman series can tell the Joker-kills-Robin story without another origin. Jared Leto's Joker gets a second chance because the hosts believe Snyder understands the character's obsession with Batman, Harley Quinn's fate, and the pressure of Robin's death. Superman's suit, the Martha choice, Wonder Woman's opening, Aquaman's arrival, the family rescue, and Steppenwolf's design all become tonal evidence. The FAM keeps the room alive with Snyderverse demands, camera jokes, a pre-stream poop ritual, and Taco Bell references. The final stretch praises Cyborg's soundtrack and asks for one more thing: continue the story while the audience is still here. Local audio and aligned ASR establish every route; playback remains the authority.",
    topics: Object.freeze(["Zack Snyder's Justice League", "Snyderverse", "Cyborg", "Jared Leto Joker", "Batman", "Robin", "Harley Quinn", "Flashpoint", "Nightmare sequence", "Darkseid", "Superman", "Wonder Woman", "Aquaman", "Steppenwolf", "Joss Whedon", "Warner Bros", "FAM culture"]),
    highlights: Object.freeze(highlights),
    story: Object.freeze(story),
    fanRead: Object.freeze({
      loved: Object.freeze({ at: 620, end: 1120, label: "CYBORG'S ARC IS THE RECEIPT", topic: "Cyborg", body: "Play the Cyborg and rooftop-scene comparison for the cleanest explanation of why the restored cut mattered to the booth.", playAt: 620, playEnd: 1120 }),
      hated: Object.freeze({ at: 1120, end: 1640, label: "THE WEDON/STUDIO RESPONSIBILITY FIGHT", topic: "Snyder Cut", body: "Play the studio and director-responsibility section for the night's most concentrated anger about a movie being changed midstream.", playAt: 1120, playEnd: 1640 }),
      wildestDetour: Object.freeze({ at: 3000, end: 3260, label: "THE PRE-STREAM POOP SCHEDULE", topic: "WWAM Up in Ya", body: "Play the synchronized pre-stream bathroom ritual for the most unnecessary production note in the dossier.", playAt: 3000, playEnd: 3260 }),
      lastWord: Object.freeze({ at: 9380, end: 10180, label: "FLASHPOINT INTO JUSTICE LEAGUE TWO AND THREE", topic: "Snyderverse futures", body: "Play the final roadmap for the clearest complete future plan the stream invents on air.", playAt: 9380, playEnd: 10180 })
    }),
    fam: Object.freeze({
      callouts: Object.freeze([
        { at: 850, end: 900, name: "Bernardo Guzman Jr.", kind: "Super Chat", note: "Calls the Snyder Cut phenomenal and asks about the future." },
        { at: 880, end: 930, name: "Restore the Snyderverse", kind: "chat receipt", note: "The slogan becomes a live planning prompt during the first future-lore lane." },
        { at: 1690, end: 1730, name: "Monster Essay", kind: "Super Chat", note: "Brings up James Wan and Aquaman's relationship to the restored cut." },
        { at: 2200, end: 2240, name: "Jeff Hill", kind: "Super Chat", note: "Raises the Marvel-versus-Batman money problem during the future roadmap." },
        { at: 2600, end: 2645, name: "Simone Morris", kind: "Super Chat", note: "Asks the booth to let Snyder continue his thing after seeing the cut." },
        { at: 2875, end: 2925, name: "Lauren", kind: "chat receipt", note: "Adds to the early reaction stream around the Snyderverse." },
        { at: 2895, end: 2945, name: "Michael Farah", kind: "chat receipt", note: "Shares a specific complaint about the restored cut." },
        { at: 2935, end: 2990, name: "Philip Fuller", kind: "chat receipt", note: "Adds a reaction while the room debates the two versions." },
        { at: 2990, end: 3040, name: "Tomo Gato", kind: "chat receipt", note: "Asks for more adult DC stories." },
        { at: 3090, end: 3150, name: "Gypsy Warrior", kind: "Super Chat", note: "Brings up Warner Bros. possibilities and an animated-series revival." },
        { at: 3320, end: 3360, name: "Air Cut question", kind: "chat receipt", note: "Asks whether another cut could be restored." },
        { at: 3360, end: 3405, name: "Hashbrown", kind: "Super Chat", note: "Returns the room to Restore the Snyderverse." },
        { at: 4100, end: 4160, name: "Brandon Hughes", kind: "Super Chat", note: "Reads the Joker/Batman exchange as a key character receipt." },
        { at: 4370, end: 4415, name: "Juju32", kind: "Super Chat", note: "Says the Snyder Cut made the story click for them." },
        { at: 4630, end: 4675, name: "Zachary Bloom", kind: "Super Chat", note: "Adds a comic poop tangent during the Joker discussion." },
        { at: 5840, end: 5890, name: "Jeff Hill", kind: "Super Chat", note: "Joins after the Aquaman discussion and asks about the next lane." },
        { at: 6480, end: 6535, name: "Mike White Jr.", kind: "Super Chat", note: "Adds a grindage receipt during the Batman/Wonder Woman comparison." },
        { at: 6550, end: 6605, name: "Dirk Jason All", kind: "Super Chat", note: "Offers a career memorial for the Whedon lane." },
        { at: 6760, end: 6830, name: "William Long", kind: "Super Chat", note: "Reminds the hosts of an earlier Snyder Cut message and asks for a response." },
        { at: 7000, end: 7060, name: "Dorman", kind: "Super Chat", note: "Points out a Whedon choice in the Superman rescue scene." },
        { at: 7540, end: 7600, name: "I Cup", kind: "chat receipt", note: "Provides the deliberately bad joke that becomes part of the Wonder Woman lane." },
        { at: 7700, end: 7750, name: "Wham Fam", kind: "chat receipt", note: "Declares the restored cut's value during the Wonder Woman comparison." },
        { at: 8270, end: 8325, name: "Remelial Dawson", kind: "Super Chat", note: "Asks about the Flash scenes during the late action discussion." },
        { at: 9410, end: 9460, name: "T-Y-I-E", kind: "Super Chat", note: "Thanks the hosts during the Superman/Cyborg ending lane." },
        { at: 9550, end: 9605, name: "Austin", kind: "chat receipt", note: "Adds a young Jim Carrey and Steppenwolf joke to the future lane." },
        { at: 10100, end: 10165, name: "Sugar Shane", kind: "Super Chat", note: "Pitches a Batman story without another origin." },
        { at: 10620, end: 10685, name: "Cyborg soundtrack question", kind: "chat receipt", note: "The FAM helps close on Cyborg's music and the film's rating." }
      ]),
      note: "Named FAM receipts are kept only where the local caption/audio ledger makes the name and interaction audible. No donation amount, identity, or off-tape outcome is inferred."
    })
  });
  root.WWAM_EPISODE_EDITORIAL_PACKS = Object.freeze({ schema: registry.schema || "shokker-episode-editorial-packs/v1", generated: "2026-08-09", sources: Object.freeze(sources) });
})(typeof window !== "undefined" ? window : globalThis);
