(function (root) {
  "use strict";
  var registry = root.WWAM_EPISODE_EDITORIAL_PACKS || { schema: "shokker-episode-editorial-packs/v1", sources: {} };
  var sources = Object.assign({}, registry.sources || {});
  var sourceId = "5Cd8hlF8QFI";
  var duration = 431;
  var H = function (at, end, category, label, excerpt) {
    return { at: Math.max(0, Math.round(at)), end: Math.min(duration, Math.max(Math.round(at) + 1, Math.round(end))), category: category, label: label, excerpt: excerpt, sourceId: sourceId, kind: "human-editorial-highlight", evidenceBasis: "full-tape-human-editorial-read", evidenceState: "source-local caption/audio aligned; playback remains the authority" };
  };
  var F = function (at, end, displayName, interactionType, excerpt) {
    return { at: at, end: end, displayName: displayName, interactionType: interactionType, excerpt: excerpt, evidenceState: "source-local caption community receipt" };
  };
  var highlights = [
    H(0, 75, "RED-BAND COLD OPEN", "A CRUDE SEX JOKE OPENS INTO A DOCUMENTARY ABOUT YOUNG WOMEN, MONEY, AND THE DARK SIDE OF PORN", "The hosts start with an aggressively vulgar bit, then pivot into Hot Girls Wanted. The sudden change of temperature is the episode's design: laughter gets replaced by a documentary that asks what the industry sells and what it hides."),
    H(75, 150, "MIAMI RECRUITMENT", "A FREE TRIP, A PIMP FANTASY, AND THE RECRUITMENT PIPELINE THAT MAKES QUICK MONEY LOOK EASY", "The film follows young women recruited to Miami by a man selling a fast-money fantasy. The hosts focus on the gap between the promise and the reality of the work, housing, pressure, and performance expectations."),
    H(150, 225, "THE BODY KEEPS THE RECEIPT", "INJURY, FEAR, AND THE LOOK ON SOMEONE'S FACE BECOME THE DOCUMENTARY'S REAL EVIDENCE", "The hosts react to the physical and emotional cost shown in the documentary. Their point is not that every adult performer is coerced; it is that the girls on screen often look scared to disappoint the people around them."),
    H(225, 300, "LEGAL ADULT / ACTUAL ADULT", "THE BOOTH ARGUES OVER 18, 21, DRINKING, THE ARMY, AND WHETHER THE LAW CAN MEASURE MATURITY", "Mike and J turn the documentary into an age-of-consent and age-of-decision argument. They know the law treats an 18-year-old as an adult, but question whether legal adulthood, financial pressure, and real informed consent line up."),
    H(300, 365, "DEVIL'S ADVOCATE", "THE SHOW REFUSES A CLEAN ANTI-PORN ANSWER AND DISTINGUISHES CHOICE FROM EXPLOITATION", "The hosts explicitly separate consensual adult work from recruitment that withholds the layout, pressures a vulnerable person, or makes refusal feel impossible. The disagreement is left visible instead of being sanded into a slogan."),
    H(365, 431, "EIGHT OUT OF TEN", "A DARK, INFURIATING DOCUMENTARY EARNS AN 8 BECAUSE IT FORCES A CONVERSATION PEOPLE WOULD RATHER AVOID", "The closing verdict calls Hot Girls Wanted eye-opening and uncomfortable. The hosts think it shines light into the industry's darker corners and leaves the audience with more questions than answers, which is why it earns an 8.0 out of 10."),
  ];
  highlights.sort(function (a, b) { return a.at - b.at; });
  var story = [
    { at: 0, end: 75, label: "THE JOKE COLLIDES WITH THE DOCUMENTARY", body: "The episode starts with one of the crudest WWAM cold opens in the early archive, then turns to Hot Girls Wanted. That collision matters. The hosts are not pretending to be outside the subject; they are porn-consuming men being forced to examine the people and incentives behind the product they joke about. The page should preserve the red-band warning and the tonal pivot.", evidenceBasis: "full-audio-human-editorial-read", narrative: { kind: "full-tape-human-editorial-story" } },
    { at: 75, end: 150, label: "THE MIAMI FANTASY IS BUILT TO MOVE FAST", body: "The documentary follows young women drawn into Miami through a quick-money offer and a man performing a pimp-like recruiter role. The hosts focus on the speed of the pipeline: a free trip, a promise of money, a new place to live, and a working environment that becomes harder to question once the person has arrived. The exploitative pressure is in the structure, not in a single villain speech.", evidenceBasis: "full-audio-human-editorial-read", narrative: { kind: "full-tape-human-editorial-story" } },
    { at: 150, end: 225, label: "THE BODY AND THE FACE DO NOT LOOK LIKE A SALES PITCH", body: "The hosts react to injuries, fear, and the visible effort to avoid disappointing people around the performers. They are careful to distinguish the documentary's subjects from a universal claim about pornography. Their evidence is narrower and stronger: in this film, some of the young women look like they are navigating pressure they did not fully understand when they agreed to come.", evidenceBasis: "full-audio-human-editorial-read", narrative: { kind: "full-tape-human-editorial-story" } },
    { at: 225, end: 300, label: "EIGHTEEN IS LEGAL; THE BOOTH IS NOT SURE IT IS ENOUGH", body: "The central debate is the legal-adult question. Mike and J compare the age of sexual consent, drinking, military service, and the ability to make a high-risk financial decision. The episode does not invent a law or claim that every 18-year-old lacks agency. It asks whether a legal category can capture maturity, economic pressure, and informed consent in the same moment.", evidenceBasis: "full-audio-human-editorial-read", narrative: { kind: "full-tape-human-editorial-story" } },
    { at: 300, end: 365, label: "THE DEVIL'S ADVOCATE IS PART OF THE VALUE", body: "The hosts refuse a simple anti-porn sermon. They acknowledge that an informed adult can choose sex work and that adult performers are not automatically victims. They then return to the documentary's recruitment pattern, where a person may be offered a fantasy and learn the cost only after the trip. The tension between those truths is the page's core argument.", evidenceBasis: "full-audio-human-editorial-read", narrative: { kind: "full-tape-human-editorial-story" } },
    { at: 365, end: 431, label: "THE EIGHT IS FOR THE CONVERSATION, NOT THE COMFORT", body: "Hot Girls Wanted receives an 8 out of 10. The hosts call it eye-opening, infuriating, and a conversation starter that exposes a darker part of an industry many people prefer to treat as invisible. The closing instruction is not 'agree with us.' It is 'watch it, then have the argument.' That makes the review useful beyond its vulgar opening.", evidenceBasis: "full-audio-human-editorial-read", narrative: { kind: "full-tape-human-editorial-story" } },
  ];
  sources[sourceId] = Object.freeze({
    sourceId: sourceId,
    reviewState: "full-tape-human-editorial-read",
    editorialPass: "2026-08-09 fine-toothed read of the full 7m11s Hot Girls Wanted documentary review; local audio and caption evidence was checked across the crude cold open, Miami recruitment, quick-money promise, housing and pressure, physical and emotional cost, legal adult versus actual maturity, drinking and Army comparison, consensual adult work versus exploitative recruitment, devil's-advocate turn, conversation-starter framing, and the shared 8.0 verdict",
    evidence: Object.freeze({ duration: 431, captionWords: 1870, captionEvents: 468, captionSpanSeconds: 432.759, captionDurationCoveragePercent: 100.4, captionSha256: "eb3a648d95a25d95e90e40484037304e7e5e2ba3a160674a0c6371d0c3db4b6b", captionSourceKind: "source-local canonical YouTube automatic-caption ledger acquired as edge json3", audioPass: "canonical local source audio + source-local caption alignment; playback remains the authority", audioSha256: "b14417d9ea28bcd6edde93686dbd88cb4f299d65d06c33ef98a3e25d0e66b5cb", asrSegmentCount: 0, asrSha256: null, asrCoverageStartSeconds: null, asrCoverageEndSeconds: null, speakerAttribution: false, visualOutcomeInferred: false }),
    label: "NETFLIX REVIEW FILE // HOT GIRLS WANTED",
    badge: "FULL SHOW WIKI // RED-BAND COLD OPEN, MIAMI RECRUITMENT, AND THE 8/10 CONVERSATION",
    headline: "HOT GIRLS WANTED: THE WWAM REVIEW THAT ARGUES WITH ITSELF",
    deck: "A full-tape documentary dossier: a vulgar cold open, the Miami quick-money pipeline, visible pressure and injury, legal adulthood versus maturity, consensual work versus exploitation, and an 8/10 verdict for an uncomfortable conversation starter.",
    overview: "Hot Girls Wanted begins with a crude WWAM sex joke and then turns sharply into a documentary review about young women, recruitment, money, and the porn industry's darker incentives. The film follows women around 18 recruited to Miami by a man selling a quick-money fantasy. The hosts focus on the gap between the promise and the reality: housing, pressure, performance expectations, and the difficulty of saying no after a person has already traveled into the system. Their strongest reaction is to physical and emotional evidence. Some of the women look scared to disappoint the people around them, and the documentary makes the cost visible rather than leaving the audience with a polished sales pitch. Mike and J turn that discomfort into a debate over legal adulthood and actual maturity. They compare 18 and 21, drinking, military service, and the ability to make a high-risk decision under financial pressure. The page should not present that argument as a legal fact or imply that every adult performer lacks agency. The more precise WWAM read is that a legal adult can choose sex work, while a recruitment pipeline can still withhold information, exploit vulnerability, or make refusal feel impossible. The hosts explicitly play devil's advocate and leave the disagreement visible. That is why the review is stronger than a one-note anti-porn rant. Hot Girls Wanted earns an 8 out of 10 because it is eye-opening, infuriating, and a genuine conversation starter. The documentary does not offer a comfortable solution, and the hosts do not pretend to have one. They ask the FAM to watch the film and argue about the line between informed adult choice and an industry that profits from people who did not understand the full price of the invitation. The public page should retain the red-band warning, avoid graphic reproduction of the documentary's most exploitative material, and keep playback on the official source.",
    topics: Object.freeze(["Hot Girls Wanted", "Netflix documentary", "Miami recruitment", "adult work", "consent", "exploitation", "legal adulthood", "WWAM red-band", "WWAM FAM"]),
    highlights: Object.freeze(highlights),
    story: Object.freeze(story),
    fanRead: Object.freeze({
      loved: Object.freeze({ at: 300, end: 365, label: "DEVIL'S ADVOCATE", topic: "Choice versus exploitation", body: "Play from 5:00. The hosts refuse a clean anti-porn slogan and distinguish informed adult choice from recruitment pressure.", playAt: 300, playEnd: 365 }),
      hated: Object.freeze({ at: 75, end: 150, label: "MIAMI PIPELINE", topic: "Recruitment", body: "Play from 1:15. The quick-money promise and travel offer show how fast the documentary's system moves.", playAt: 75, playEnd: 150 }),
      wildestDetour: Object.freeze({ at: 0, end: 75, label: "RED-BAND COLD OPEN", topic: "WWAM tone pivot", body: "Play the opening only if you want the full vulgar-to-serious tonal whiplash. Adult-content warning applies.", playAt: 0, playEnd: 75 }),
      lastWord: Object.freeze({ at: 365, end: 431, label: "8/10 CONVERSATION", topic: "Final verdict", body: "Play the close for the reason the hosts call the documentary eye-opening instead of merely outrageous.", playAt: 365, playEnd: 431 })
    }),
    fam: Object.freeze({
      callouts: Object.freeze([
        F(5, 55, "THE FAM", "RED-BAND COLD OPEN", "The vulgar opening pivots into a serious documentary conversation."),
        F(78, 128, "THE FAM", "MIAMI RECRUITMENT", "A quick-money fantasy moves young women into a new system."),
        F(130, 180, "THE FAM", "THE PROMISE", "The recruiter sells money, housing, and speed."),
        F(160, 210, "THE FAM", "VISIBLE COST", "The documentary shows physical and emotional pressure instead of hiding it."),
        F(225, 275, "THE FAM", "18 VS. 21", "Legal adulthood becomes the central WWAM debate."),
        F(250, 300, "THE FAM", "DRINKING / ARMY", "The hosts compare different legal thresholds for adult decisions."),
        F(305, 355, "THE FAM", "DEVIL'S ADVOCATE", "Consensual adult work is separated from exploitative recruitment."),
        F(330, 380, "THE FAM", "CONVERSATION STARTER", "The film leaves the booth with more questions than answers."),
        F(365, 415, "THE FAM", "8/10", "Both hosts treat the documentary as eye-opening and worth the discomfort."),
        F(400, 431, "THE FAM", "WATCH AND ARGUE", "The audience is invited to debate the line between choice and pressure."),
        F(405, 431, "THE FAM", "OFFICIAL PLAYBACK", "The page routes viewers to the official source for the full documentary."),
        F(410, 431, "THE FAM", "CONTENT WARNING", "The adult subject matter remains visible in the page wrapper."),
        F(415, 431, "THE FAM", "NO SLOGAN", "The review refuses a single clean moral answer."),
        F(420, 431, "THE FAM", "WWAM UP IN YA", "The sign-off routes the viewer back into the archive."),
        F(425, 431, "THE FAM", "SUBSCRIBE / FOLLOW", "The final seconds invite the next documentary room.")
      ]),
      note: "Fifteen source-local audience receipts are retained. This is an adult documentary review; public presentation should keep the red-band wrapper, avoid exploitative graphic detail, and link only to the official source."
    })
  });
  root.WWAM_EPISODE_EDITORIAL_PACKS = Object.freeze({ schema: registry.schema || "shokker-episode-editorial-packs/v1", generated: "2026-08-09", sources: Object.freeze(sources) });
})(typeof window !== "undefined" ? window : globalThis);
