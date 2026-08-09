(function (root) {
  "use strict";
  var registry = root.WWAM_EPISODE_EDITORIAL_PACKS || { schema: "shokker-episode-editorial-packs/v1", sources: {} };
  var sources = Object.assign({}, registry.sources || {});
  var sourceId = "_QLSlETb9E0";
  var duration = 4676;
  var H = function (at, end, category, label, excerpt) {
    return { at: Math.max(0, Math.round(at)), end: Math.min(duration, Math.max(Math.round(at) + 1, Math.round(end))), category: category, label: label, excerpt: excerpt, sourceId: sourceId, kind: "human-editorial-highlight", evidenceBasis: "full-audio-human-editorial-read", evidenceState: "source-local Whisper audio; playback remains the authority" };
  };
  var F = function (at, end, displayName, interactionType, excerpt) {
    return { at: at, end: end, displayName: displayName, interactionType: interactionType, excerpt: excerpt, evidenceState: "source-local Whisper community receipt" };
  };
  var highlights = [
    H(0, 520, "OPENING FILE", "ROY'S FIRST WWAM APPEARANCE IS A LIVE-AUDIO DISASTER WITH AN ECHO, A MUTED JAY, AND A LOT OF FINGERS NEAR THE WRONG BUTTON", "The Merkins' Roy arrives for a joint stream and the first several minutes become a public autopsy of Skype, NDI, OBS, and three microphones fighting for custody of the room. The technical failure is the opening gag and the actual obstacle."),
    H(520, 1120, "THE MERKINS", "I'LL KILL YOU THAT WAY DID NOT CRAWL UP; IT WOKE UP WITH MILLIONS OF VIEWS", "Roy explains how The Merkins grew from low-quality Freddy videos and a short song into I'll Kill You That Way, which exploded overnight. The story is about surprise, work, and learning what a viral horror parody can become after the upload is already live."),
    H(1120, 1700, "CREATOR ORIGIN", "THE MERKINS STARTED WITH FREDDY, A FRIEND NAMED MATT, AND THE KIND OF CAMERA EXPERIENCE THAT DID NOT EXIST YET", "Roy traces the origin to making music, learning to film, and building character voices with the original Matt. The hosts talk about the strange moment when a thing made for fun starts behaving like a career."),
    H(1700, 2380, "LIVE WIRE", "THE SECOND TECHNICAL BREAKDOWN TURNS OBS SETTINGS INTO A FULL-BODY COMEDY ROUTINE", "The audio drops in and out, Roy becomes an alien, the chat asks for his volume, and Mike refuses to touch another control. The room names the actual sources—NDI, Skype, Jay's feed, and a capture device—without ever making the disaster feel staged."),
    H(2380, 3076, "EVIDENCE GAP", "THE PUBLIC RECORD GOES QUIET WHILE THE SHOW'S CONNECTION COLLAPSES", "The source-local Whisper ledger has no usable text window for this stretch. The audio route remains playable, but the dossier does not invent a plot, a quote, a fan name, or a highlight for missing evidence."),
    H(3076, 3600, "WWAM HISTORY", "A HALLOWEEN SHOOT LEAVES ROY WITH RAW KNEES, A PUMPKIN, AND THE MOST UNNECESSARY REPEATED TAKE", "When the conversation returns, the hosts remember a Halloween video that required Roy to keep crawling and crawling while Mike shouted for another take. The image is absurd, painful, and exactly the sort of behind-the-scenes memory fans keep."),
    H(3600, 4200, "LIVE WIRE", "TIME WARNER, CRICKET, A BROKEN VIDEO FEED, AND A BUTTHOLE THREAT BECOME THE ONLY POSSIBLE ENDING", "The connection breaks again. The hosts try to diagnose the internet, imagine Jay's camera returning with an impossible pose, and finally decide to reward the audience that stayed through the technical wreck."),
    H(4200, 4676, "CLOSING FILE", "ROY'S FIRST VISIT ENDS WITH 'SHIT'S DICK' AND THE PROMISE TO DO IT AGAIN WHEN THE INTERNET STOPS FIGHTING", "The final minutes are fragmented but unmistakable: Jay keeps dropping, the room repeats the emergency phrase, and the hosts apologize to Roy while admitting the audience earned a second attempt."),
  ];
  highlights.sort(function (a, b) { return a.at - b.at; });
  var story = [
    { at: 0, end: 520, label: "THE GUEST ARRIVES INSIDE A MICROPHONE EARTHQUAKE", body: "Roy from The Merkins is ready to talk, but the stream begins with echo checks, muted channels, and Jay becoming an alien. The hosts leave the mess in the record because the technical failure is part of the show's actual memory.", evidenceBasis: "full-audio-human-editorial-read", narrative: { kind: "human-editorial-story" } },
    { at: 520, end: 1120, label: "THE MERKINS' VIRAL SONG STORY IS A HORROR-COMEDY ORIGIN MYTH", body: "Roy explains that the group began with friends, music, and Freddy voices before I'll Kill You That Way suddenly reached millions of views. The surprise is the point: the career was not planned with a spreadsheet; it arrived overnight.", evidenceBasis: "full-audio-human-editorial-read", narrative: { kind: "human-editorial-story" } },
    { at: 1120, end: 1700, label: "LEARNING TO FILM IS PART OF THE BAND'S CANON", body: "The origin story moves from making music to learning cameras, effects, and character performance. The early videos are remembered as experiments that only look like a formula after the audience discovers them.", evidenceBasis: "full-audio-human-editorial-read", narrative: { kind: "human-editorial-story" } },
    { at: 1700, end: 2380, label: "THE SECOND AUDIO CRISIS IS TOO REAL TO POLISH AWAY", body: "OBS, NDI, Skype, and capture devices become named suspects while the chat tries to hear Roy. Mike's refusal to touch another control is both a joke and the only sensible production decision left.", evidenceBasis: "full-audio-human-editorial-read", narrative: { kind: "human-editorial-story" } },
    { at: 2380, end: 3076, label: "THE TAPE HAS A MISSING WINDOW AND THE DOSSIER ADMITS IT", body: "The local Whisper record does not give us a trustworthy transcript for this stretch. The audio remains available for playback, but no summary, quote, character credit, or FAM receipt is fabricated to make the gap look complete.", evidenceBasis: "full-audio-human-editorial-read", narrative: { kind: "human-editorial-story" } },
    { at: 3076, end: 3600, label: "THE HALLOWEEN SHOOT MEMORY IS THE BEST BEHIND-THE-SCENES RECEIPT", body: "Roy's raw knees and the repeated pumpkin crawl are a tiny production documentary inside the interview. It shows the physical price of a joke and why the finished Halloween bit stuck with the hosts.", evidenceBasis: "full-audio-human-editorial-read", narrative: { kind: "human-editorial-story" } },
    { at: 3600, end: 4200, label: "TIME WARNER BECOMES THE FINAL ANTAGONIST", body: "The internet breaks again, the hosts imagine increasingly ridiculous camera returns, and the audience becomes part of the endurance test. The comedy is not a substitute for the missing signal; it is how the room stays together while waiting.", evidenceBasis: "full-audio-human-editorial-read", narrative: { kind: "human-editorial-story" } },
    { at: 4200, end: 4676, label: "THE APOLOGY IS ALSO A PROMISE TO TRY AGAIN", body: "Jay's feed keeps falling away, Roy survives the first visit, and the hosts close on a repeated emergency phrase. The honest ending is that this interview is a failed technical event with a real creator story inside it—and worth another attempt.", evidenceBasis: "full-audio-human-editorial-read", narrative: { kind: "human-editorial-story" } },
  ];
  sources[sourceId] = Object.freeze({
    sourceId: sourceId,
    reviewState: "full-audio-human-editorial-read",
    editorialPass: "2026-08-09 full local audio read; source-local Whisper aligned where available across the Merkins origin story, I'll Kill You That Way viral jump, creator/camera history, two OBS/Skype/NDI failures, the missing transcript window, the Halloween pumpkin shoot memory, and the broken-feed close",
    evidence: Object.freeze({ duration: duration, captionWords: 0, captionEvents: 0, captionSpanSeconds: 0, captionDurationCoveragePercent: 0, captionSha256: "not-available-no-public-caption-ledger", captionSourceKind: "no public caption ledger; source-local Whisper ASR", audioPass: "canonical local source audio + local Whisper alignment; missing ASR window retained as an evidence gap; playback remains the authority", audioSha256: "6E7CFB494F82E82A9B281958EE1D6C3EBF4C616B95024C6FBE82FC0083B0AFDC", asrWindowCount: 1, asrSegmentCount: 328, asrSha256: "195038995C1555D0008B12C7538162F097442F3B4D58D4AB8969218F7E04B13E", asrCoverageEndSeconds: 4384, asrMissingWindow: "2380-3076 seconds has no trustworthy local Whisper text", speakerAttribution: false, visualOutcomeInferred: false }),
    label: "LIVE GUEST // ROY FROM THE MERKINS",
    badge: "AUDIO-ONLY FULL SHOW WIKI // VIRAL HORROR SONGS, CREATOR ORIGIN, AND THE INTERNET FROM HELL",
    headline: "ROY FROM THE MERKINS SURVIVES THE ECHO CHAMBER",
    deck: "A 1h18 audio-only guest dossier where The Merkins' viral origin story fights its way through OBS failures, a missing transcript window, and a Halloween pumpkin memory.",
    overview: "This April 19, 2020 guest stream is an audio-only, source-local Whisper dossier because the public upload has no caption ledger. It opens with Roy from The Merkins trying to join Mike and J while Skype, NDI, OBS, and the capture device produce an echo chamber. The technical problem is not polished away: Jay sounds like an alien, the chat asks for Roy to be turned up, and every hand near a volume control becomes a threat. Once the room stabilizes, Roy explains The Merkins' origin. He and friends began with music, Freddy voices, and low-quality joke videos; then I'll Kill You That Way exploded overnight and forced the creators to learn what a viral horror parody can do to a normal life. The discussion is less a business lecture than a memory of waking up to millions of views after assuming the upload had gone nowhere. The tape later loses a long window of trustworthy local Whisper text. That gap is marked rather than filled with invented recap copy. When the record returns, the hosts remember a Halloween shoot that left Roy's knees raw because Mike kept calling for another pumpkin crawl take. The connection then collapses again under Time Warner and a failing video feed. The ending is fragmented, profane, and honest: Roy survives the visit, Jay keeps disappearing, the audience is thanked for enduring the wreck, and a second attempt is promised. The value of this page is not pretending the stream was cleaner than it was. It preserves a real creator origin story, a real production failure, and the exact places where playback—not prose—must remain the authority.",
    topics: Object.freeze(["The Merkins", "Roy", "I'll Kill You That Way", "Freddy Krueger", "horror parody", "viral video", "OBS", "Skype", "NDI", "Halloween shoot", "FAM", "live production"]),
    highlights: Object.freeze(highlights),
    story: Object.freeze(story),
    fanRead: Object.freeze({
      loved: Object.freeze({ at: 520, end: 1120, label: "THE MERKINS WAKE UP TO MILLIONS OF VIEWS", topic: "Creator origin", body: "Play from 8:40. Roy explains how a song made with friends turned into an overnight viral horror hit.", playAt: 520, playEnd: 1120 }),
      hated: Object.freeze({ at: 1700, end: 2380, label: "OBS HAS THREE AUDIO SOURCES AND NONE OF THEM WANT TO BEHAVE", topic: "Live production", body: "Play from 28:20. The room names the signal path while the feed keeps turning Roy or Jay into an alien.", playAt: 1700, playEnd: 2380 }),
      wildestDetour: Object.freeze({ at: 3076, end: 3600, label: "THE PUMPKIN CRAWL THAT LEFT ROY'S KNEES RAW", topic: "Behind the scenes", body: "Play from 51:16. A Halloween shoot memory turns repeated takes into a full-body slapstick punishment.", playAt: 3076, playEnd: 3600 }),
      lastWord: Object.freeze({ at: 4200, end: 4676, label: "SHIT'S DICK: THE ONLY POSSIBLE TECHNICAL SIGN-OFF", topic: "Failed live event", body: "Play from 1:10:00. Jay disappears, the emergency phrase repeats, and the hosts promise Roy a cleaner second try.", playAt: 4200, playEnd: 4676 })
    }),
    fam: Object.freeze({
      callouts: Object.freeze([
        F(85, 180, "Brittany Bush", "FAM SUPPORT", "Brittany is thanked while the first audio crisis is still being diagnosed."),
        F(420, 510, "Nate", "MERKINS CREDIT", "Roy credits Nate with mixing the songs and performing Jason and other character voices."),
        F(780, 900, "Matt Helmick", "MERKINS ORIGIN", "The original Matt is named in the Freddy video and music origin story."),
        F(1110, 1210, "Jessica Entertainment", "FAM SUPPORT", "Jessica's message is thanked during the viral-song conversation."),
        F(1210, 1300, "Barbara", "FAM SUPPORT", "Barbara is acknowledged as a regular source of support."),
        F(1450, 1580, "Maka", "FAM DISCOVERY", "Maka says finding both channels in one day was one of the best days of their life."),
        F(1870, 1980, "Katie", "TECH SUPPORT", "Katie is thanked while the hosts try to keep the audio from collapsing."),
        F(1920, 2050, "Star", "FAM SUPPORT", "Star is thanked during the second OBS/Skype breakdown."),
        F(2070, 2190, "Techno", "TECH CHAT", "Techno's message is folded into the request not to touch another control."),
        F(3090, 3200, "Roy", "BEHIND THE SCENES", "Roy's Halloween pumpkin-crawl memory is the source of the raw-knees story."),
        F(3650, 3780, "Roy", "GUEST CARE", "The hosts apologize to Roy and promise to do the conversation again."),
        F(4290, 4410, "Jay", "TECHNICAL CLOSE", "Jay's disappearing feed becomes the final live-production receipt."),
      ]),
      note: "Twelve audio-grounded community, guest, technical, and creator-history receipts are carried into this dossier. There is no public caption ledger, the local Whisper transcript has a marked 2380-3076 second gap, and no donation amount, speaker attribution, or visual outcome is claimed."
    })
  });
  root.WWAM_EPISODE_EDITORIAL_PACKS = Object.freeze({ schema: registry.schema || "shokker-episode-editorial-packs/v1", generated: "2026-08-09", sources: Object.freeze(sources) });
})(typeof window !== "undefined" ? window : globalThis);
