(function (root) {
  "use strict";
  var registry = root.WWAM_EPISODE_EDITORIAL_PACKS || { schema: "shokker-episode-editorial-packs/v1", sources: {} };
  var sources = Object.assign({}, registry.sources || {});
  var H = function (at, end, category, label, excerpt, characters) {
    var item = {
      at: at,
      end: end,
      category: category,
      label: label,
      excerpt: excerpt,
      sourceId: "0X8Jq7wxfJo",
      evidenceState: "machine surfaced; full-caption/audio second read; playback remains the authority",
    };
    if (characters) item.characters = characters;
    return item;
  };

  /* May 24, 2022: We Watched THE BATMAN short watch-along. */
  sources["0X8Jq7wxfJo"] = Object.freeze({
    sourceId: "0X8Jq7wxfJo",
    reviewState: "full-tape-human-editorial-read-edge",
    editorialPass: "2026-08-08 fine-toothed full-tape editorial read; official caption ledger plus canonical local audio pass across the May 24, 2022 We Watched THE BATMAN upload",
    evidence: Object.freeze({
      duration: 588,
      captionWords: 1637,
      captionEvents: 241,
      captionSpanSeconds: 587.4,
      captionDurationCoveragePercent: 99.9,
      captionSha256: "sha256:ef6469fdcf431939ada786e36194a8ebb2f191939d6aab20de895f6ff6dc6665",
      captionSourceKind: "official YouTube automatic caption ledger acquired as JSON3",
      audioPass: "canonical YouTube audio + official-caption second read; local audio playback spot-check; playback remains the authority",
      audioSha256: "sha256:662ce309283a398dc0d7708ef5054f91c6d0bcba0644d9c16035a2a156b7bbdf",
      asrWindowCount: 0,
      speakerAttribution: false,
      visualOutcomeInferred: false,
    }),
    label: "WE WATCHED THE BATMAN // MAY 24, 2022",
    badge: "FULL SHOW WIKI // BATMAN'S TINY MUSCLES, RIDDLER'S FACE-TIME, CATWOMAN'S MILK, AND THE HORNY BATCAVE",
    headline: "THE HORNY BATMAN CUT: ROBERT PATTINSON, RIDDLER, AND A VERY UNPROFESSIONAL DETECTIVE",
    deck: "This short watch-along does not review The Batman like a respectable adult. It turns every shadow, shoulder bump, fake wig, milk glass, and Riddler meltdown into a crude WWAM character trial.",
    overview: "The Batman arrives in this short WWAM cut as a rapid-fire reaction room rather than a full-length commentary. The format is compact, but the tape is not thin: it keeps finding a new joke or a new visual accusation every few seconds. The opening turns a wrong scotch, a missing God-bless-you, and a lower-back wiener threat into the kind of social etiquette audit Batman never asked for. Gotham then becomes Walmart at 3 a.m., a Kentucky Applebee's, a dentist's chair, and a place where a man in the shadows may secretly be Ken Kniff from Connecticut. When the movie tries to make Bruce Wayne intimidating, Mike and J immediately examine the shoulders, the back muscles, the teenager energy, the Christian Bale fighting style, and the inexplicable decision to shoulder-bump a stranger. The tape's best character read is that this Batman is Vengeance in his own head but a socially awkward man who cannot stop talking about his dead parents in public. Catwoman's milk, Maroni/bologna, fake wigs, a detective badge, and a criminal's sex collar turn the middle into a full WWAM comedy lane. The Riddler is treated as a FaceTime dad, a grocery-store card decline, a successful painful dump, and a man who has broken his nose while trying to sing through the disaster. The film-read lane still lands: the football focus creates impending doom, the shadow imagery looks cool, the rat-with-wings clue is a satisfying bat joke, and the movie's grim textures make even a bad scene look like a RoboCop crime broadcast. The final third is all self-indictment. Mike and J admit they could never play Batman because they would turn every scene horny, then close with subscriber math, Patreon promises, cat pee, the white-faced Michael Myers button, Loomis failing, and Dr. Challis getting drunk again. It is a small source with a complete WWAM fingerprint.",
    story: Object.freeze([
      { at: 0, end: 72, label: "THE BOOTH ENTERS GOTHAM", body: "Wrong scotch, missing sneeze etiquette, a lower-back wiener threat, Walmart at 3 a.m., and Ken Kniff establish the tape's rules before Batman can solve a crime." },
      { at: 72, end: 144, label: "THE MOVIE LOOKS LIKE A NIGHTMARE", body: "Football imagery, impending doom, Campbell's smells, Kentucky Applebee's, the dentist, and the obvious-speech Batman bit turn atmosphere into a running visual roast." },
      { at: 144, end: 216, label: "BATMAN IS A TERRIBLE SOCIAL HUMAN", body: "Bruce's back muscles, teenager energy, Christian Bale's fighting style, the shoulder bump, Total Recall, and the pandemic-era champ argument expose the gap between Vengeance and basic manners." },
      { at: 216, end: 288, label: "CATWOMAN, BOLOGNA, AND FAKE WIGS", body: "Milk, cat jokes, Maroni/bologna, Alfred's missing SpaghettiOs, fake wigs, and the sex-collar detour make the Gotham middle feel like a badly supervised group chat." },
      { at: 288, end: 360, label: "THE RAT HAS WINGS", body: "The Riddler's FaceTime-parent posture, the bomb panic, Ask Jeeves, a federal-crime envelope, Nirvana, and Where's Waldo shoulders turn the clue sequence into a detective farce." },
      { at: 360, end: 432, label: "THE HORNY BATCAVE PROBLEM", body: "Steve Rogers, Vengeance, George Clooney, Caesar cuts, dead dads, the military line, and the admission that WWAM could never play Batman without getting horny." },
      { at: 432, end: 504, label: "THE RIDDLE OF THE FAILED CARD", body: "A fiance's no-sex night, a declined grocery card, a successful painful dump, Josh Whedon accusations, Bane, and a broken nose become the Riddler's most useful character study." },
      { at: 504, end: 588, label: "PATREON, CAT PEE, AND HALLOWEEN", body: "Batcave logistics give way to subscriber math, a new Patreon, a shower emergency, cat pee, a white-faced Myers refrain, Loomis, Dr. Challis, and the October 31 exit button." },
    ]),
    highlights: Object.freeze([
      H(8, 20, "WWAM UP IN YA", "THE WRONG SCOTCH", "The opening etiquette crisis is not murder; it is a man getting mad because the scotch is wrong."),
      H(22, 34, "STRAIGHT TO STEVE'S ASSHOLE", "THE LOWER-BACK WIENER", "A dead body is immediately turned into a question about putting a wiener on someone's lower back."),
      H(36, 48, "SOUNDBYTE / REPLAY", "THE CROMPTILL REGION", "The tape invents a geography lesson for the Cromptill region while the scene becomes increasingly indecent."),
      H(50, 62, "WWAM UP IN YA", "WALMART AT THREE A.M.", "Gotham's shadow imagery is compared with walking through Walmart at 3 a.m., a perfect WWAM mood translation."),
      H(64, 76, "CHARACTER PERFORMANCE", "KEN KNIFF FROM CONNECTICUT", "A background figure becomes Ken Kniff from Connecticut before Batman has time to introduce himself.", ["Batman"]),
      H(78, 90, "FILM READ", "THE FOOTBALLS ARE IMPENDING DOOM", "The focused football imagery is praised for making a simple shot feel like an approaching catastrophe."),
      H(92, 104, "SOUNDBYTE / REPLAY", "KENTUCKY APPLEBEE'S", "The visual tone is compared with entering a Kentucky Applebee's at 10 p.m., which is somehow more frightening than Gotham."),
      H(106, 118, "STRAIGHT TO STEVE'S ASSHOLE", "THE DENTIST'S CHAIR", "A point-of-view shot becomes the feeling of walking into a dentist's office while they inspect your teeth."),
      H(120, 132, "WWAM UP IN YA", "BATMAN STATES THE OBVIOUS", "The hosts imagine Batman walking around saying obvious things like, 'You're wearing a turtleneck.'"),
      H(134, 146, "SOUNDBYTE / REPLAY", "THE CROSSWORD PUZZLE DETECTIVE", "Batman is reduced to a detective who sits down to pee and complains that Gotham lacks a good bathroom for cocaine."),
      H(148, 160, "STRAIGHT TO STEVE'S ASSHOLE", "TOUCHES RABBITS", "A darkly suspicious character read becomes the claim that somebody touches rabbits to his penis."),
      H(162, 174, "WWAM UP IN YA", "SKIPPING SCHOOL WITH WAYNE", "The score becomes the song for skipping school, driving past the building, and letting Wayne keep going."),
      H(176, 188, "FILM READ", "THE TEENAGER NEEDS STYLE", "Bruce's body is judged as a teenager who needs a stylist rather than a fully formed Batman."),
      H(190, 202, "CHARACTER PERFORMANCE", "ROBERT NEEDS A GYM", "The commentary separates Robert Pattinson's performance from the visual problem: Batman needs shoulders and a gym.", ["Bruce Wayne / Batman"]),
      H(204, 216, "TAKE GETS NUCLEAR", "THE SHOULDER BUMP", "Batman shoulder-bumping a stranger for no reason earns the simplest possible verdict: what a dick."),
      H(218, 230, "FILM READ", "TOTAL RECALL FIGHT CLUB", "The club entrance is compared with Total Recall, while the fighting style is measured against Christian Bale's much longer training."),
      H(232, 244, "SOUNDBYTE / REPLAY", "PANDEMIC CHAMP", "A pandemic-era 'go, champ' exchange turns into a dead-dad argument about who is allowed to call somebody champ."),
      H(246, 258, "STRAIGHT TO STEVE'S ASSHOLE", "DOLLAR GENERAL SHAMPOO", "A cheap-shampoo smell is pinned to a man who seems to have arrived from Dollar General."),
      H(260, 272, "WWAM UP IN YA", "TIKTOK OVER THIRTY", "The scene becomes what any man over thirty looks like when he tries to use TikTok for the first time."),
      H(274, 286, "FILM READ", "CATWOMAN'S MILK", "The hosts notice the milk and treat it as the film's most immediate evidence that this is Catwoman."),
      H(288, 300, "STRAIGHT TO STEVE'S ASSHOLE", "THE PUSSIES ON THE ANKLES", "Catwoman's room is described as smelling like shit while the cats rub against the speaker's ankles."),
      H(302, 314, "SOUNDBYTE / REPLAY", "MARONI RHYMES WITH BOLOGNA", "Maroni becomes a bologna/macaronis rhyme before Alfred's missing SpaghettiOs enter the case file."),
      H(316, 328, "STRAIGHT TO STEVE'S ASSHOLE", "THE FAKE-ASS WIG", "A character's hair gets cross-examined as a fake-ass wig that cannot decide what color it is."),
      H(330, 342, "CHARACTER PERFORMANCE", "THE SECRET-CLUB DETECTIVE", "The detective identity is played as a secret-club persona with a sex collar and absolutely no normal social boundaries.", ["Bruce Wayne / Batman"]),
      H(344, 356, "WWAM UP IN YA", "RIDDLER FACE-TIMES HIS PARENTS", "The Riddler's close-up is compared with parents who do not understand FaceTime and move their faces too close to the phone."),
      H(358, 370, "SOUNDBYTE / REPLAY", "GET OUT OF MY HOUSE", "The Riddler's meltdown becomes the sound of a drunk person waking up after a blackout and being told to leave."),
      H(372, 384, "TAKE GETS NUCLEAR", "THE TERRIBLE FACE PAN", "The scene can look cool until the camera pans onto the face; that exact pan is sent straight into the bad-decision file."),
      H(386, 398, "FILM READ", "THE RAT HAS WINGS", "The clue is finally translated into the obvious answer: it is a rat with wings, which is a bat."),
      H(400, 412, "STRAIGHT TO STEVE'S ASSHOLE", "ASK JEEVES DOT COM", "Batman asking the Riddler for help is compared with the golden age of Ask Jeeves."),
      H(414, 426, "WWAM UP IN YA", "BRUCE WAYNE'S EYES ONLY", "A private envelope becomes a federal crime and a perfect opportunity to call someone a son of a bitch."),
      H(428, 440, "SOUNDBYTE / REPLAY", "MUDDY BANKS OF WISCONSIN", "Bruce's body gets linked with a Muddy Banks of Wisconsin Nirvana CD left outside the gym."),
      H(442, 454, "FILM READ", "WHERE'S WALDO SHOULDERS", "The other man's shoulders look like Where's Waldo, which is the tape's last word on Bruce's physique."),
      H(456, 468, "CHARACTER PERFORMANCE", "VENGEANCE CORRECTS THE NAME", "Batman insists that his name is Batman, not Vengeance, before admitting he says Vengeance when he is in the mood.", ["Bruce Wayne / Batman"]),
      H(470, 482, "STRAIGHT TO STEVE'S ASSHOLE", "THE CAESAR-CUT PROBLEM", "A crude imagined sex scene turns short hair into a Caesar cut and George Clooney into the least welcome Batcave guest."),
      H(484, 496, "WWAM UP IN YA", "WE COULD NEVER PLAY BATMAN", "Mike and J admit they could never be cast as Batman because every serious scene would become horny."),
      H(498, 510, "TAKE GETS NUCLEAR", "THE DEAD-DAD SPEECH", "Bruce taking off the mask and talking about his dead father is treated as a military-recruitment argument gone emotionally wrong."),
      H(512, 524, "SOUNDBYTE / REPLAY", "THE FIANCE SAID NO SEX", "The Riddler's panic is compared with a man whose fiance says no sex tonight after he planned the entire evening."),
      H(526, 538, "STRAIGHT TO STEVE'S ASSHOLE", "THE DECLINED GROCERY CARD", "A failed Riddler plan becomes the exact moment a grocery card gets declined and a man starts singing."),
      H(540, 552, "WWAM UP IN YA", "THE SUCCESSFUL PAINFUL DUMP", "The Riddler is praised for the facial expression of a successful but painful dump."),
      H(554, 566, "FILM READ", "JOSH WHEDON SHOT THIS", "The camera move is blamed on Josh Whedon before the room immediately moves on to Bane."),
      H(568, 580, "SOUNDBYTE / REPLAY", "BANE BROKE HIS NOSE", "The Riddler is treated like Bane after a bad fight: broken, confused, and still trying to finish the sentence."),
      H(582, 588, "WWAM UP IN YA", "THE WHITE-FACED EXIT", "The outro jumps from guano and Batcave promises to the white-faced Halloween refrain, Loomis failing, and Dr. Challis getting drunk again."),
    ]),
    fanRead: Object.freeze({
      loved: Object.freeze({ at: 78, end: 104, label: "THE ATMOSPHERE", topic: "football dread and Gotham texture", body: "Play from 1:18. The football focus, doom feeling, and strange city texture are the short cut's cleanest film-read praise.", playAt: 78, playEnd: 104 }),
      hated: Object.freeze({ at: 372, end: 384, label: "THE BAD FACE PAN", topic: "a cool scene ruined by one camera move", body: "Play from 6:12. The hosts hate the exact pan onto the face even though the scene around it is working.", playAt: 372, playEnd: 384 }),
      wildestDetour: Object.freeze({ at: 470, end: 496, label: "THE HORNY BATCAVE", topic: "why WWAM could never play Batman", body: "Play from 7:50. Caesar cuts, George Clooney, short hair, and the admission that every Batman scene would become horny make this the most unhinged detour.", playAt: 470, playEnd: 496 }),
      lastWord: Object.freeze({ at: 504, end: 588, label: "LOOMIS CANNOT RECOVER", topic: "Patreon, cat pee, Halloween, and the filthy exit", body: "Play from 8:24. Subscriber promises, a shower emergency, cat pee, the white-faced Myers refrain, Loomis, and Dr. Challis close the compact Batman tape.", playAt: 504, playEnd: 588 }),
    }),
  });

  root.WWAM_EPISODE_EDITORIAL_PACKS = Object.freeze({
    schema: registry.schema || "shokker-episode-editorial-packs/v1",
    generated: "2026-08-08",
    sources: Object.freeze(sources),
  });
})(typeof window !== "undefined" ? window : globalThis);
